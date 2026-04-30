const express = require('express');
const router = express.Router();
const User = require('../models/User');
const NotificationTemplate = require('../models/NotificationTemplate');
const WorkoutLog = require('../models/WorkoutLog');
const { protect, adminOnly } = require('../middleware/auth');
const { applyPreferredTimeToTemplate } = require('../services/userNotificationPreferences');
const {
  DEFAULT_NOTIFICATION_TEMPLATES,
  VALID_NOTIFICATION_KEYS,
  sortNotificationTemplates,
} = require('../services/notificationCatalog');

// Seed defaults if collection is empty, or migrate from old schema
async function seedNotificationTemplates() {
  await NotificationTemplate.deleteMany({
    key: { $in: ['message_1', 'message_1_recovery', 'message_1_personalized'] },
  });

  for (const tmpl of DEFAULT_NOTIFICATION_TEMPLATES) {
    const exists = await NotificationTemplate.findOne({ key: tmpl.key });
    if (!exists) {
      await NotificationTemplate.create(tmpl);
      console.log(`Seeded missing template: ${tmpl.key}`);
      continue;
    }

    if (exists.label !== tmpl.label || exists.description !== tmpl.description) {
      await NotificationTemplate.updateOne(
        { key: tmpl.key },
        {
          label: tmpl.label,
          description: tmpl.description,
        },
      );
      console.log(`Synced metadata for template: ${tmpl.key}`);
    }
  }
}

async function getMergedTemplatesForUser(userId) {
  await seedNotificationTemplates();

  const [user, templates] = await Promise.all([
    User.findById(userId).select('preferred_time'),
    NotificationTemplate.find({ key: { $in: VALID_NOTIFICATION_KEYS } }),
  ]);

  return sortNotificationTemplates(templates).map((templateDoc) => {
    const template = applyPreferredTimeToTemplate(
      templateDoc.toObject(),
      user?.preferred_time,
    );
    return {
      ...template,
      is_overridden: false,
    };
  });
}

// === PUBLIC: Get all templates (for mobile app) ===
router.get('/', protect, async (req, res) => {
  try {
    const templates = await getMergedTemplatesForUser(req.user._id);
    res.json(templates);
  } catch (error) {
    console.error('Get notification templates error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === PUBLIC: Get last workout date for current user ===
router.get('/last-workout', protect, async (req, res) => {
  try {
    const lastWorkout = await WorkoutLog.findOne({
      user_id: req.user._id,
      is_completed: true,
    })
      .sort({ completed_at: -1 })
      .select('completed_at');

    res.json({
      last_workout_at: lastWorkout?.completed_at || null,
    });
  } catch (error) {
    console.error('Get last workout error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === ADMIN: Get base templates for all users ===
router.get('/admin', protect, adminOnly, async (req, res) => {
  try {
    await seedNotificationTemplates();
    const templates = await NotificationTemplate.find({ key: { $in: VALID_NOTIFICATION_KEYS } });
    res.json(sortNotificationTemplates(templates));
  } catch (error) {
    console.error('Get admin notification templates error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// === ADMIN: Update a template ===
router.put('/:key', protect, adminOnly, async (req, res) => {
  try {
    const { key } = req.params;
    const { title, body, hour, minute, is_active } = req.body;

    if (!VALID_NOTIFICATION_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Key không hợp lệ' });
    }

    const update = {};
    if (title !== undefined) update.title = title;
    if (body !== undefined) update.body = body;
    if (hour !== undefined) update.hour = Math.max(0, Math.min(23, Number(hour)));
    if (minute !== undefined) update.minute = Math.max(0, Math.min(59, Number(minute)));
    if (is_active !== undefined) update.is_active = is_active;
    update.updated_at = new Date();

    const template = await NotificationTemplate.findOneAndUpdate(
      { key },
      update,
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'Template không tồn tại' });
    }

    res.json(template);
  } catch (error) {
    console.error('Update notification template error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
module.exports.seedNotificationTemplates = seedNotificationTemplates;
module.exports.getMergedTemplatesForUser = getMergedTemplatesForUser;
