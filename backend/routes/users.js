const express = require('express');
const router = express.Router();
const User = require('../models/User');
const WorkoutLog = require('../models/WorkoutLog');
const NotificationToken = require('../models/NotificationToken');
const NotificationTemplate = require('../models/NotificationTemplate');
const NotificationUserOverride = require('../models/NotificationUserOverride');
const { protect, adminOnly } = require('../middleware/auth');
const { getMergedTemplatesForUser } = require('./notificationTemplates');
const { dispatchNotificationsOnce } = require('../services/notificationDispatcher');
const { getPreferredTimeLabel } = require('../services/userNotificationPreferences');
const { VALID_NOTIFICATION_KEYS } = require('../services/notificationCatalog');

// GET /api/users/stats - Dashboard stats (admin)
// CRITICAL: This route MUST come before /:id to prevent Express treating 'stats' as an ID
router.get('/stats', protect, adminOnly, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalExercises = (await require('../models/Exercise').countDocuments());
    
    const today = new Date().toISOString().split('T')[0];
    const todayWorkouts = await WorkoutLog.countDocuments({
      completed_at: { $gte: new Date(today) }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeUsers = await WorkoutLog.distinct('user_id', {
      completed_at: { $gte: sevenDaysAgo }
    });

    res.json({
      totalUsers,
      totalExercises,
      todayWorkouts,
      activeUsers: activeUsers.length,
    });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/users - Get all users (admin)
router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().sort({ created_at: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/users/notification-overview - Notification status by user (admin)
router.get('/notification-overview', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .sort({ created_at: -1 })
      .select('full_name email is_pro notifications_enabled created_at');

    const userIds = users.map((user) => user._id);

    const [tokens, lastWorkouts] = await Promise.all([
      NotificationToken.find({ user_id: { $in: userIds } }).select('user_id platform created_at'),
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
            last_workout_at: { $first: '$completed_at' },
          },
        },
      ]),
    ]);

    const tokenMap = new Map();
    tokens.forEach((tokenDoc) => {
      const key = String(tokenDoc.user_id);
      const current = tokenMap.get(key) || {
        has_push_token: false,
        token_platforms: new Set(),
        token_updated_at: null,
      };

      current.has_push_token = true;
      current.token_platforms.add(tokenDoc.platform);
      current.token_updated_at = tokenDoc.created_at;
      tokenMap.set(key, current);
    });

    const workoutMap = new Map(
      lastWorkouts.map((item) => [String(item._id), item.last_workout_at || null]),
    );

    const overview = users.map((user) => {
      const tokenInfo = tokenMap.get(String(user._id));
      return {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        is_pro: user.is_pro,
        notifications_enabled: user.notifications_enabled !== false,
        has_push_token: !!tokenInfo?.has_push_token,
        token_platforms: tokenInfo ? Array.from(tokenInfo.token_platforms) : [],
        token_updated_at: tokenInfo?.token_updated_at || null,
        last_workout_at: workoutMap.get(String(user._id)) || null,
        created_at: user.created_at,
      };
    });

    res.json(overview);
  } catch (error) {
    console.error('Notification overview error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/users/notifications/dispatch-now - Run notification dispatcher immediately (admin)
router.post('/notifications/dispatch-now', protect, adminOnly, async (req, res) => {
  try {
    const summary = await dispatchNotificationsOnce();
    res.json(summary);
  } catch (error) {
    console.error('Manual notification dispatch error:', error);
    res.status(500).json({ error: 'Không thể chạy bộ gửi thông báo' });
  }
});

// GET /api/users/:id/notification-overrides - Get merged notification config for a user (admin)
router.get('/:id/notification-overrides', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('full_name email role preferred_time');
    if (!user || user.role === 'admin') {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    const templates = await getMergedTemplatesForUser(req.params.id);
    res.json({
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        preferred_time: user.preferred_time || '20:00',
        preferred_time_label: getPreferredTimeLabel(user.preferred_time),
      },
      templates,
    });
  } catch (error) {
    console.error('Get user notification overrides error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/users/:id/notification-overrides/:key - Save override for a user (admin)
router.put('/:id/notification-overrides/:key', protect, adminOnly, async (req, res) => {
  try {
    const { id, key } = req.params;
    const { title, body, hour, minute, is_active } = req.body;

    if (!VALID_NOTIFICATION_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Key không hợp lệ' });
    }

    const user = await User.findById(id).select('role');
    if (!user || user.role === 'admin') {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    const baseTemplate = await NotificationTemplate.findOne({ key });
    if (!baseTemplate) {
      return res.status(404).json({ error: 'Template không tồn tại' });
    }

    const payload = {
      user_id: id,
      key,
      title: title?.trim() || baseTemplate.title,
      body: body?.trim() || baseTemplate.body,
      hour: hour !== undefined ? Math.max(0, Math.min(23, Number(hour))) : baseTemplate.hour,
      minute: minute !== undefined ? Math.max(0, Math.min(59, Number(minute))) : baseTemplate.minute,
      is_active: typeof is_active === 'boolean' ? is_active : baseTemplate.is_active,
      updated_at: new Date(),
    };

    const override = await NotificationUserOverride.findOneAndUpdate(
      { user_id: id, key },
      payload,
      { new: true, upsert: true, runValidators: true }
    );

    res.json(override);
  } catch (error) {
    console.error('Save user notification override error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/users/:id/notification-overrides/:key - Reset user override to global template (admin)
router.delete('/:id/notification-overrides/:key', protect, adminOnly, async (req, res) => {
  try {
    const { id, key } = req.params;

    if (!VALID_NOTIFICATION_KEYS.includes(key)) {
      return res.status(400).json({ error: 'Key không hợp lệ' });
    }

    await NotificationUserOverride.deleteOne({ user_id: id, key });
    res.json({ success: true });
  } catch (error) {
    console.error('Reset user notification override error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/users/:id/notifications - Update notification status for a user (admin)
router.put('/:id/notifications', protect, adminOnly, async (req, res) => {
  try {
    const { notifications_enabled } = req.body;

    if (typeof notifications_enabled !== 'boolean') {
      return res.status(400).json({ error: 'notifications_enabled phải là boolean' });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        notifications_enabled,
        updated_at: new Date(),
      },
      { new: true }
    ).select('full_name email notifications_enabled');

    if (!user) {
      return res.status(404).json({ error: 'Không tìm thấy user' });
    }

    res.json(user);
  } catch (error) {
    console.error('Update user notification status error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/users/:id/devices - Update user devices (admin)
router.put('/:id/devices', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { owned_devices: req.body.owned_devices },
      { new: true }
    );
    if (!user) return res.status(404).json({ error: 'Không tìm thấy user' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
