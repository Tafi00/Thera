const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const NotificationToken = require('../models/NotificationToken');
const NotificationTemplate = require('../models/NotificationTemplate');
const NotificationDispatchLog = require('../models/NotificationDispatchLog');
const { seedNotificationTemplates, getMergedTemplatesForUser } = require('../routes/notificationTemplates');
const { sendExpoPushNotification, isExpoPushToken } = require('./pushNotifications');
const { applyPreferredTimeToTemplate } = require('./userNotificationPreferences');
const {
  VALID_NOTIFICATION_KEYS,
  RECOVERY_DAYS,
  PERSONALIZED_DAYS,
  PERSONALIZED_START_DAY,
  getRecoveryTemplateKey,
  getPersonalizedTemplateKey,
} = require('./notificationCatalog');

const DISPATCH_INTERVAL_MS = Number(process.env.NOTIFICATION_DISPATCH_INTERVAL_MS || 60_000);
const NOTIFICATION_TIMEZONE = process.env.NOTIFICATION_TIMEZONE || 'Asia/Ho_Chi_Minh';

let dispatcherInterval = null;
let isDispatching = false;

function getZonedParts(date, timeZone = NOTIFICATION_TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = formatter.formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') {
      acc[part.type] = part.value;
    }
    return acc;
  }, {});

  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
  };
}

function getZonedDayNumber(date, timeZone = NOTIFICATION_TIMEZONE) {
  const parts = getZonedParts(date, timeZone);
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / 86_400_000);
}

function getZonedDateKey(date, timeZone = NOTIFICATION_TIMEZONE) {
  const { year, month, day } = getZonedParts(date, timeZone);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function diffDaysInTimeZone(later, earlier, timeZone = NOTIFICATION_TIMEZONE) {
  return getZonedDayNumber(later, timeZone) - getZonedDayNumber(earlier, timeZone);
}

function matchesCurrentMinute(template, now, timeZone = NOTIFICATION_TIMEZONE) {
  const parts = getZonedParts(now, timeZone);
  return template.hour === parts.hour && template.minute === parts.minute;
}

function buildMergedTemplates(baseTemplates) {
  return (user) => baseTemplates.map((templateDoc) => {
    const template = applyPreferredTimeToTemplate(
      templateDoc.toObject(),
      user?.preferred_time,
    );
    return template;
  });
}

function resolveDueNotifications({ user, templates, lastWorkoutAt, now }) {
  const templateMap = new Map(templates.map((template) => [template.key, template]));
  const dueNotifications = [];
  const recoveryStartedAt = user.personalized_plan_started_at ? new Date(user.personalized_plan_started_at) : null;
  const recoveryCompletedAt = user.personalized_plan_completed_at ? new Date(user.personalized_plan_completed_at) : null;
  const personalizedUnlockAt = user.personalized_plan_unlock_at ? new Date(user.personalized_plan_unlock_at) : null;

  let dailyTemplate = null;
  if (recoveryStartedAt) {
    const recoveryDayIndex = diffDaysInTimeZone(now, recoveryStartedAt);
    if (recoveryDayIndex >= 0 && recoveryDayIndex < RECOVERY_DAYS) {
      const recoveryTemplate = templateMap.get(
        getRecoveryTemplateKey(recoveryDayIndex + 1),
      );
      if (recoveryTemplate?.is_active) {
        dailyTemplate = recoveryTemplate;
      }
    }

    if (recoveryCompletedAt && personalizedUnlockAt) {
      const personalizedDayIndex = diffDaysInTimeZone(now, personalizedUnlockAt);
      if (personalizedDayIndex >= 0 && personalizedDayIndex < PERSONALIZED_DAYS) {
        const personalizedTemplate = templateMap.get(
          getPersonalizedTemplateKey(PERSONALIZED_START_DAY + personalizedDayIndex),
        );
        if (personalizedTemplate?.is_active) {
          dailyTemplate = personalizedTemplate;
        }
      }
    }
  }

  if (dailyTemplate && matchesCurrentMinute(dailyTemplate, now)) {
    dueNotifications.push({
      key: dailyTemplate.key,
      title: dailyTemplate.title,
      body: dailyTemplate.body,
      deliverySlot: `${dailyTemplate.key}:${getZonedDateKey(now)}`,
    });
  }

  const inactivityBaseDate = lastWorkoutAt || recoveryStartedAt;
  if (!inactivityBaseDate) {
    return dueNotifications;
  }

  const inactivityMessages = [
    { key: 'message_3', threshold: 3 },
    { key: 'message_5', threshold: 5 },
    { key: 'message_7', threshold: 7 },
  ];
  const daysSinceBase = diffDaysInTimeZone(now, inactivityBaseDate);

  inactivityMessages.forEach(({ key, threshold }) => {
    const template = templateMap.get(key);
    if (!template?.is_active) {
      return;
    }

    if (daysSinceBase !== threshold || !matchesCurrentMinute(template, now)) {
      return;
    }

    dueNotifications.push({
      key,
      title: template.title,
      body: template.body,
      deliverySlot: `${key}:${getZonedDateKey(now)}`,
    });
  });

  return dueNotifications;
}

async function createPendingDispatchLog(notification, userId) {
  try {
    return await NotificationDispatchLog.create({
      user_id: userId,
      key: notification.key,
      delivery_slot: notification.deliverySlot,
      title: notification.title,
      body: notification.body,
      status: 'pending',
    });
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await NotificationDispatchLog.findOne({
        user_id: userId,
        key: notification.key,
        delivery_slot: notification.deliverySlot,
      });

      if (!existing || existing.status === 'sent') {
        return null;
      }

      existing.status = 'pending';
      existing.error_message = '';
      existing.updated_at = new Date();
      await existing.save();
      return existing;
    }
    throw error;
  }
}

async function sendNotificationToUser({ userId, email, tokenDoc, notification }) {
  const log = await createPendingDispatchLog(notification, userId);
  if (!log) {
    return { skipped: true, reason: 'already_sent' };
  }

  try {
    const result = await sendExpoPushNotification({
      token: tokenDoc.token,
      title: notification.title,
      body: notification.body,
      data: {
        notification_key: notification.key,
        user_id: String(userId),
      },
    });

    await NotificationDispatchLog.findByIdAndUpdate(log._id, {
      status: 'sent',
      sent_at: new Date(),
      expo_ticket_id: result.ticketId,
      updated_at: new Date(),
    });

    return {
      skipped: false,
      sent: true,
      ticketId: result.ticketId,
    };
  } catch (error) {
    await NotificationDispatchLog.findByIdAndUpdate(log._id, {
      status: 'failed',
      error_message: error.message || 'Gửi push thất bại',
      updated_at: new Date(),
    });

    if (String(error.message || '').includes('DeviceNotRegistered')) {
      await NotificationToken.deleteOne({ _id: tokenDoc._id });
    }

    console.error(`Notification dispatch failed for ${email} / ${notification.key}:`, error.message);
    throw error;
  }
}

async function dispatchNotificationsOnce() {
  if (isDispatching) {
    return {
      skipped: true,
      reason: 'dispatcher_busy',
    };
  }

  isDispatching = true;

  try {
    await seedNotificationTemplates();

    const users = await User.find({
      role: { $ne: 'admin' },
      notifications_enabled: { $ne: false },
      _id: { $ne: null },
    }).select(
      'full_name email notifications_enabled personalized_plan_started_at personalized_plan_completed_at personalized_plan_unlock_at preferred_time',
    );

    if (users.length === 0) {
      return {
        checkedUsers: 0,
        sentCount: 0,
        skippedNoToken: 0,
        dueCount: 0,
      };
    }

    const userIds = users.map((user) => user._id);
    const [tokens, lastWorkouts, baseTemplates] = await Promise.all([
      NotificationToken.find({ user_id: { $in: userIds } }).select('user_id token platform'),
      WorkoutLog.aggregate([
        {
          $match: {
            user_id: { $in: userIds },
            is_completed: true,
          },
        },
        { $sort: { completed_at: -1 } },
        {
          $group: {
            _id: '$user_id',
            completed_at: { $first: '$completed_at' },
          },
        },
      ]),
      NotificationTemplate.find({ key: { $in: VALID_NOTIFICATION_KEYS } }).sort({ key: 1 }),
    ]);

    const tokenMap = new Map(tokens.map((tokenDoc) => [String(tokenDoc.user_id), tokenDoc]));
    const lastWorkoutMap = new Map(lastWorkouts.map((item) => [String(item._id), item.completed_at || null]));
    const getTemplatesForUser = buildMergedTemplates(baseTemplates);

    const summary = {
      checkedUsers: users.length,
      sentCount: 0,
      skippedNoToken: 0,
      dueCount: 0,
      failedCount: 0,
    };
    const now = new Date();

    for (const user of users) {
      const tokenDoc = tokenMap.get(String(user._id));
      if (!tokenDoc || !isExpoPushToken(tokenDoc.token)) {
        summary.skippedNoToken += 1;
        continue;
      }

      const templates = getTemplatesForUser(user);
      const lastWorkoutAt = lastWorkoutMap.get(String(user._id)) || null;
      const dueNotifications = resolveDueNotifications({
        user,
        templates,
        lastWorkoutAt,
        now,
      });

      summary.dueCount += dueNotifications.length;

      for (const notification of dueNotifications) {
        try {
          const result = await sendNotificationToUser({
            userId: user._id,
            email: user.email,
            tokenDoc,
            notification,
          });
          if (!result.skipped) {
            summary.sentCount += 1;
          }
        } catch (error) {
          summary.failedCount += 1;
        }
      }
    }

    return summary;
  } finally {
    isDispatching = false;
  }
}

async function sendPreviewNotificationsToUser(userId, keys = VALID_NOTIFICATION_KEYS) {
  await seedNotificationTemplates();

  const user = await User.findById(userId).select('email role');
  if (!user || user.role === 'admin') {
    throw new Error('Không tìm thấy user hợp lệ để test thông báo');
  }

  const tokenDoc = await NotificationToken.findOne({ user_id: userId }).select('token platform');
  if (!tokenDoc || !isExpoPushToken(tokenDoc.token)) {
    throw new Error('User chưa có push token hợp lệ');
  }

  const templates = await getMergedTemplatesForUser(userId);
  const normalizedKeys = Array.isArray(keys) && keys.length > 0 ? keys : VALID_NOTIFICATION_KEYS;
  const notifications = templates
    .filter((template) => normalizedKeys.includes(template.key) && template.is_active)
    .map((template) => ({
      key: template.key,
      title: `[Preview] ${template.title}`,
      body: template.body,
      deliverySlot: `preview:${template.key}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`,
    }));

  if (notifications.length === 0) {
    return {
      sentCount: 0,
      notifications: [],
    };
  }

  const sentKeys = [];

  for (const notification of notifications) {
    await sendNotificationToUser({
      userId,
      email: user.email,
      tokenDoc,
      notification,
    });
    sentKeys.push(notification.key);
  }

  return {
    sentCount: sentKeys.length,
    notifications: sentKeys,
  };
}

function startNotificationDispatcher() {
  if (dispatcherInterval) {
    return;
  }

  void dispatchNotificationsOnce()
    .then((summary) => {
      console.log('Notification dispatcher boot run:', summary);
    })
    .catch((error) => {
      console.error('Notification dispatcher boot error:', error);
    });

  dispatcherInterval = setInterval(() => {
    void dispatchNotificationsOnce()
      .then((summary) => {
        if (summary.sentCount || summary.failedCount || summary.dueCount) {
          console.log('Notification dispatcher tick:', summary);
        }
      })
      .catch((error) => {
        console.error('Notification dispatcher tick error:', error);
      });
  }, DISPATCH_INTERVAL_MS);

  console.log(
    `Notification dispatcher started: every ${DISPATCH_INTERVAL_MS}ms (${NOTIFICATION_TIMEZONE})`,
  );
}

module.exports = {
  dispatchNotificationsOnce,
  startNotificationDispatcher,
  resolveDueNotifications,
  getZonedDateKey,
  sendPreviewNotificationsToUser,
};
