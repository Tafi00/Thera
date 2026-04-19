const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { OAuth2Client } = require('google-auth-library');
const User = require('../models/User');
const { generateToken } = require('../utils/jwt');
const { protect } = require('../middleware/auth');

const googleClient = new OAuth2Client();

const GOOGLE_AUDIENCES = [
  process.env.GOOGLE_WEB_CLIENT_ID,
  process.env.GOOGLE_ANDROID_CLIENT_ID,
  process.env.GOOGLE_IOS_CLIENT_ID,
].filter(Boolean);

// POST /api/auth/admin-login - Admin email/password login
router.post('/admin-login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email và mật khẩu là bắt buộc' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user || user.role !== 'admin') {
      return res.status(401).json({ error: 'Bạn không có quyền truy cập admin panel' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Email hoặc mật khẩu không đúng' });
    }

    const token = generateToken(user._id, 'admin');

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/auth/google - Google Sign-In (mobile app)
router.post('/google', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'idToken là bắt buộc' });
    }

    if (!GOOGLE_AUDIENCES.length) {
      return res.status(500).json({ error: 'Google OAuth chưa được cấu hình trên server' });
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: GOOGLE_AUDIENCES,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Google token không hợp lệ' });
    }

    const {
      sub: googleId,
      email,
      name,
      picture,
      email_verified,
    } = payload;

    if (!email || !email_verified) {
      return res.status(401).json({ error: 'Email Google chưa được xác minh' });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      if (!user.googleId) user.googleId = googleId;
      if (picture) user.avatar_url = picture;
      if (name && !user.full_name) user.full_name = name;
      await user.save();
    } else {
      user = await User.create({
        googleId,
        email,
        full_name: name || '',
        avatar_url: picture || '',
        role: 'user',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url,
        role: user.role,
        is_pro: user.is_pro,
        age: user.age,
        occupation: user.occupation,
        gender: user.gender,
        height: user.height,
        weight: user.weight,
        target_weight: user.target_weight,
        primary_goal: user.primary_goal,
        focus_area: user.focus_area,
        limitations: user.limitations,
        diet_type: user.diet_type,
        pain_areas: user.pain_areas,
        symptoms: user.symptoms,
        surgery_history: user.surgery_history,
        preferred_time: user.preferred_time,
        personalized_plan_started_at: user.personalized_plan_started_at,
        personalized_plan_completed_at: user.personalized_plan_completed_at,
        personalized_plan_unlock_at: user.personalized_plan_unlock_at,
        onboarding_completed: user.onboarding_completed,
        owned_devices: user.owned_devices,
        created_at: user.created_at,
      },
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// GET /api/auth/me - Get current user profile
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/auth/profile - Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const allowedFields = [
      'full_name', 'age', 'occupation', 'gender', 'height', 'weight',
      'target_weight', 'primary_goal', 'focus_area', 'limitations',
      'diet_type', 'pain_areas', 'symptoms', 'surgery_history',
      'preferred_time', 'avatar_url', 'owned_devices', 'onboarding_completed',
      'personalized_plan_started_at', 'personalized_plan_completed_at',
      'personalized_plan_unlock_at'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });
    updates.updated_at = new Date();

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json(user);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/auth/profile/sync - Upsert profile (mobile app background sync)
router.post('/profile/sync', protect, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date() };
    delete updates.role;
    delete updates.password;
    delete updates.is_pro;

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
      upsert: false,
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Profile sync error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
