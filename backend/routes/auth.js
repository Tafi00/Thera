const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const https = require('https');
const jwt = require('jsonwebtoken');
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

const APPLE_ISSUER = 'https://appleid.apple.com';
const APPLE_KEYS_URL = `${APPLE_ISSUER}/auth/keys`;
const FACEBOOK_PROFILE_URL = 'https://graph.facebook.com/me';
const APPLE_AUDIENCES = Array.from(new Set([
  process.env.APPLE_CLIENT_ID,
  process.env.APPLE_BUNDLE_ID,
  process.env.IOS_BUNDLE_ID,
  'vn.therahome.app',
].filter(Boolean)));

let appleKeysCache = {
  keys: [],
  expiresAt: 0,
};

function buildAuthUser(user) {
  return {
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
    notifications_enabled: user.notifications_enabled,
    personalized_plan_started_at: user.personalized_plan_started_at,
    personalized_plan_completed_at: user.personalized_plan_completed_at,
    personalized_plan_unlock_at: user.personalized_plan_unlock_at,
    onboarding_completed: user.onboarding_completed,
    owned_devices: user.owned_devices,
    created_at: user.created_at,
  };
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isAppleEmailVerified(value) {
  return value === true || value === 'true';
}

function getFacebookPictureUrl(profile) {
  return typeof profile?.picture?.data?.url === 'string'
    ? profile.picture.data.url
    : '';
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      let body = '';

      response.setEncoding('utf8');
      response.on('data', (chunk) => {
        body += chunk;
      });
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error(`HTTP request failed with ${response.statusCode}`));
          return;
        }

        try {
          resolve(JSON.parse(body));
        } catch (error) {
          reject(error);
        }
      });
    });

    request.on('error', reject);
    request.setTimeout(5000, () => {
      request.destroy(new Error('HTTP request timed out'));
    });
  });
}

async function getApplePublicKey(kid) {
  const refreshKeys = async () => {
    const data = await fetchJson(APPLE_KEYS_URL);

    if (!Array.isArray(data?.keys)) {
      throw new Error('Apple keys response is invalid');
    }

    appleKeysCache = {
      keys: data.keys,
      expiresAt: Date.now() + 60 * 60 * 1000,
    };
  };

  if (Date.now() >= appleKeysCache.expiresAt) {
    await refreshKeys();
  }

  let jwk = appleKeysCache.keys.find((key) => key.kid === kid);

  if (!jwk) {
    await refreshKeys();
    jwk = appleKeysCache.keys.find((key) => key.kid === kid);
  }

  if (!jwk) {
    throw new Error('Apple public key not found');
  }

  return crypto
    .createPublicKey({ key: jwk, format: 'jwk' })
    .export({ format: 'pem', type: 'spki' });
}

async function verifyAppleIdentityToken(identityToken) {
  const decoded = jwt.decode(identityToken, { complete: true });

  if (!decoded || typeof decoded === 'string' || !decoded.header?.kid) {
    throw new Error('Apple identity token không hợp lệ');
  }

  const publicKey = await getApplePublicKey(decoded.header.kid);
  const payload = jwt.verify(identityToken, publicKey, {
    algorithms: ['RS256'],
    issuer: APPLE_ISSUER,
    audience: APPLE_AUDIENCES,
  });

  if (!payload || typeof payload === 'string' || !payload.sub) {
    throw new Error('Apple identity token không hợp lệ');
  }

  return payload;
}

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
      user: buildAuthUser(user),
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).json({ error: 'Google authentication failed' });
  }
});

// POST /api/auth/facebook - Facebook Sign-In (mobile app)
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ error: 'accessToken là bắt buộc' });
    }

    const profileUrl = `${FACEBOOK_PROFILE_URL}?${new URLSearchParams({
      fields: 'id,name,email,picture.type(large)',
      access_token: accessToken,
    }).toString()}`;
    const profile = await fetchJson(profileUrl);

    if (profile?.error) {
      return res.status(401).json({ error: profile.error.message || 'Facebook token không hợp lệ' });
    }

    const facebookId = profile?.id;
    const email = normalizeEmail(profile?.email);
    const avatarUrl = getFacebookPictureUrl(profile);

    if (!facebookId) {
      return res.status(401).json({ error: 'Facebook token không hợp lệ' });
    }

    if (!email) {
      return res.status(400).json({
        error: 'Không nhận được email từ Facebook. Vui lòng kiểm tra quyền email của tài khoản Facebook.',
      });
    }

    let user = await User.findOne({ facebookId });

    if (!user) {
      user = await User.findOne({ email });
    }

    if (user) {
      if (!user.facebookId) user.facebookId = facebookId;
      if (avatarUrl) user.avatar_url = avatarUrl;
      if (profile.name && !user.full_name) user.full_name = profile.name;
      await user.save();
    } else {
      user = await User.create({
        facebookId,
        email,
        full_name: profile.name || '',
        avatar_url: avatarUrl,
        role: 'user',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: buildAuthUser(user),
    });
  } catch (error) {
    console.error('Facebook auth error:', error);
    res.status(401).json({ error: 'Facebook authentication failed' });
  }
});

// POST /api/auth/apple - Sign in with Apple (iOS app)
router.post('/apple', async (req, res) => {
  try {
    const { identityToken, fullName } = req.body;

    if (!identityToken) {
      return res.status(400).json({ error: 'identityToken là bắt buộc' });
    }

    const payload = await verifyAppleIdentityToken(identityToken);
    const appleId = payload.sub;
    const email = normalizeEmail(payload.email);
    const displayName = typeof fullName === 'string' ? fullName.trim() : '';

    if (email && !isAppleEmailVerified(payload.email_verified)) {
      return res.status(401).json({ error: 'Email Apple chưa được xác minh' });
    }

    let user = await User.findOne({ appleId });

    if (!user && email) {
      user = await User.findOne({ email });
    }

    if (user) {
      if (!user.appleId) user.appleId = appleId;
      if (displayName && !user.full_name) user.full_name = displayName;
      await user.save();
    } else {
      if (!email) {
        return res.status(400).json({
          error: 'Không nhận được email từ Apple. Vui lòng thử đăng nhập lại và cho phép chia sẻ email.',
        });
      }

      user = await User.create({
        appleId,
        email,
        full_name: displayName,
        avatar_url: '',
        role: 'user',
      });
    }

    const token = generateToken(user._id, user.role);

    res.json({
      token,
      user: buildAuthUser(user),
    });
  } catch (error) {
    console.error('Apple auth error:', error);
    res.status(401).json({ error: 'Apple authentication failed' });
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
      'avatar_url', 'owned_devices', 'onboarding_completed', 'notifications_enabled',
      'personalized_plan_started_at', 'personalized_plan_completed_at',
      'personalized_plan_unlock_at'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    // Users may choose their preferred reminder window during onboarding only.
    if (req.body.preferred_time !== undefined && req.user?.onboarding_completed !== true) {
      updates.preferred_time = req.body.preferred_time;
    }
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
    delete updates.preferred_time;

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
