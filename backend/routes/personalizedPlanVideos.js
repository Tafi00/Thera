const express = require('express');
const router = express.Router();
const PersonalizedPlanVideo = require('../models/PersonalizedPlanVideo');
const { protect, adminOnly } = require('../middleware/auth');

const VALID_VIDEO_GROUPS = ['regular', 'device_supported'];

const buildPayload = (body = {}) => ({
  video_group: VALID_VIDEO_GROUPS.includes(body.video_group) ? body.video_group : 'regular',
  title: typeof body.title === 'string' ? body.title.trim() : '',
  description: typeof body.description === 'string' ? body.description.trim() : '',
  link: typeof body.link === 'string' ? body.link.trim() : '',
  is_active: body.is_active !== undefined ? body.is_active === true || body.is_active === 'true' : true,
});

const validatePayload = (payload) => {
  if (!VALID_VIDEO_GROUPS.includes(payload.video_group)) {
    return 'video_group không hợp lệ';
  }
  if (!payload.link) {
    return 'Thiếu link video';
  }
  return null;
};

let indexesEnsured = false;
async function ensurePersonalizedPlanVideoIndexes() {
  if (indexesEnsured) return;

  try {
    // Check if collection exists first
    const collections = await PersonalizedPlanVideo.db.db
      .listCollections({ name: PersonalizedPlanVideo.collection.name })
      .toArray();

    if (collections.length > 0) {
      try {
        await PersonalizedPlanVideo.collection.dropIndex('day_number_1');
      } catch (error) {
        const message = error?.message || '';
        if (!message.includes('index not found') && !message.includes('ns not found')) {
          console.warn('Drop old personalized plan video index warning:', message);
        }
      }

      try {
        await PersonalizedPlanVideo.collection.dropIndex('day_number_1_video_group_1');
      } catch (error) {
        const message = error?.message || '';
        if (!message.includes('index not found') && !message.includes('ns not found')) {
          console.warn('Drop old personalized plan video compound index warning:', message);
        }
      }
    }

    await PersonalizedPlanVideo.syncIndexes();
  } catch (error) {
    console.warn('Ensure personalized plan video indexes warning:', error?.message || error);
  }

  indexesEnsured = true;
}

router.use(async (req, res, next) => {
  try {
    await ensurePersonalizedPlanVideoIndexes();
  } catch (error) {
    console.warn('Index middleware error (non-fatal):', error?.message || error);
  }
  next();
});

// GET /api/personalized-plan-videos
router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.videoGroup && VALID_VIDEO_GROUPS.includes(req.query.videoGroup)) {
      filter.video_group = req.query.videoGroup;
    }
    if (req.query.isActive === 'true' || req.query.isActive === 'false') {
      filter.is_active = req.query.isActive === 'true';
    }

    const items = await PersonalizedPlanVideo.find(filter).sort({ video_group: 1, created_at: -1 });
    res.json(items);
  } catch (error) {
    console.error('Get personalized plan videos error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

async function sampleVideos(match, size) {
  const availableCount = await PersonalizedPlanVideo.countDocuments(match);

  if (availableCount === 0) {
    return { items: [], availableCount };
  }

  // If fewer videos available than requested, return all available ones
  const actualSize = Math.min(size, availableCount);
  const items = await PersonalizedPlanVideo.aggregate([
    { $match: match },
    { $sample: { size: actualSize } },
  ]);

  return { items, availableCount };
}

// GET /api/personalized-plan-videos/random?regularCount=6&deviceCount=1
router.get('/random', protect, async (req, res) => {
  try {
    const regularCount = Number.isInteger(Number(req.query.regularCount))
      ? Math.max(0, Number(req.query.regularCount))
      : 6;
    const deviceCount = Number.isInteger(Number(req.query.deviceCount))
      ? Math.max(0, Number(req.query.deviceCount))
      : 1;

    const regularResult = await sampleVideos({
      video_group: 'regular',
      is_active: true,
    }, regularCount);

    const deviceResult = await sampleVideos({
      video_group: 'device_supported',
      is_active: true,
    }, deviceCount);

    const items = [...regularResult.items, ...deviceResult.items];
    res.json({
      regular_count: regularResult.items.length,
      device_count: deviceResult.items.length,
      total: items.length,
      items,
    });
  } catch (error) {
    console.error('Random personalized plan videos error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// GET /api/personalized-plan-videos/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const item = await PersonalizedPlanVideo.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy video' });
    res.json(item);
  } catch (error) {
    console.error('Get personalized plan video detail error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/personalized-plan-videos
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const item = await PersonalizedPlanVideo.create(payload);
    res.status(201).json(item);
  } catch (error) {
    console.error('Create personalized plan video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/personalized-plan-videos/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = buildPayload(req.body);
    const validationError = validatePayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    payload.updated_at = new Date();

    const item = await PersonalizedPlanVideo.findByIdAndUpdate(req.params.id, payload, { new: true });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy video' });
    res.json(item);
  } catch (error) {
    console.error('Update personalized plan video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/personalized-plan-videos/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await PersonalizedPlanVideo.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: 'Không tìm thấy video' });
    res.json({ message: 'Đã xóa' });
  } catch (error) {
    console.error('Delete personalized plan video error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
