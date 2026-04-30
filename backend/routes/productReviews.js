const express = require('express');
const ProductReview = require('../models/ProductReview');
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

function normalizeText(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function serializeProductReview(item, viewerId = null) {
  const reviewUserId = item.user_id?._id || item.user_id || null;
  const normalizedViewerId = viewerId ? String(viewerId) : null;
  const normalizedReviewUserId = reviewUserId ? String(reviewUserId) : null;
  const scope = item.scope || 'public';

  return {
    id: item._id,
    product_id: item.product_id?._id || item.product_id,
    author_name: item.author_name,
    rating: item.rating,
    content: item.content,
    badge: item.badge || '',
    scope,
    is_mine: normalizedViewerId !== null && normalizedViewerId === normalizedReviewUserId,
    reviewer_type: scope === 'private' ? 'user' : 'admin',
    product:
      item.product_id && typeof item.product_id === 'object'
        ? {
            id: item.product_id._id,
            key: item.product_id.key,
            name: item.product_id.name,
            purchase_link: item.product_id.purchase_link || '',
            is_active: item.product_id.is_active,
          }
        : null,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

function normalizeAdminPayload(body = {}) {
  return {
    product_id: body.product_id,
    author_name: typeof body.author_name === 'string' ? body.author_name.trim() : '',
    rating: Number(body.rating),
    content: typeof body.content === 'string' ? body.content.trim() : '',
    badge: typeof body.badge === 'string' ? body.badge.trim() : '',
  };
}

function normalizePrivatePayload(body = {}) {
  return {
    product_id: body.product_id,
    rating: Number(body.rating),
    content: typeof body.content === 'string' ? body.content.trim() : '',
  };
}

async function validateCommonPayload(payload, res) {
  if (!payload.product_id) {
    res.status(400).json({ error: 'Thiếu product_id' });
    return null;
  }

  if (!payload.content) {
    res.status(400).json({ error: 'Thiếu nội dung đánh giá' });
    return null;
  }

  if (!Number.isFinite(payload.rating) || payload.rating < 1 || payload.rating > 5) {
    res.status(400).json({ error: 'rating phải từ 1 đến 5' });
    return null;
  }

  const product = await Product.findById(payload.product_id);
  if (!product) {
    res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    return null;
  }

  return product;
}

async function validateAdminPayload(payload, res) {
  if (!payload.author_name) {
    res.status(400).json({ error: 'Thiếu tên người đánh giá' });
    return null;
  }

  return validateCommonPayload(payload, res);
}

function getPublicVisibilityFilter() {
  return {
    $or: [{ scope: 'public' }, { scope: { $exists: false } }],
  };
}

function getVisibleToUserFilter(userId) {
  return {
    $or: [
      { scope: 'public' },
      { scope: { $exists: false } },
      {
        $and: [{ scope: 'private' }, { user_id: userId }],
      },
    ],
  };
}

function extractOwnedProductKeys(user) {
  const ownedDevices = Array.isArray(user?.owned_devices) ? user.owned_devices : [];
  const keys = new Set();

  ownedDevices.forEach((item) => {
    if (typeof item === 'string') {
      const normalized = normalizeText(item);

      if (
        normalized === 'ech' ||
        normalized === 'neck_device' ||
        normalized === 'theraneck' ||
        normalized.includes('neck') ||
        normalized.includes('co')
      ) {
        keys.add('ech');
      }

      if (
        normalized === 'rung' ||
        normalized === 'back_device' ||
        normalized === 'theraback' ||
        normalized.includes('back') ||
        normalized.includes('lung')
      ) {
        keys.add('rung');
      }

      return;
    }

    const key = normalizeText(item?.key || '');
    const name = normalizeText(item?.name || '');

    if (
      key === 'ech' ||
      key === 'neck_device' ||
      key === 'theraneck' ||
      name.includes('ech') ||
      name.includes('neck') ||
      name.includes('co')
    ) {
      keys.add('ech');
    }

    if (
      key === 'rung' ||
      key === 'back_device' ||
      key === 'theraback' ||
      name.includes('rung') ||
      name.includes('back') ||
      name.includes('lung')
    ) {
      keys.add('rung');
    }
  });

  return keys;
}

function userCanReviewProduct(user, product) {
  const ownedProductKeys = extractOwnedProductKeys(user);
  return ownedProductKeys.has(normalizeText(product?.key || ''));
}

router.get('/', async (req, res) => {
  try {
    const filter = {
      ...getPublicVisibilityFilter(),
    };

    if (req.query.product_id) {
      filter.product_id = req.query.product_id;
    }

    const items = await ProductReview.find(filter)
      .populate('product_id')
      .sort({ product_id: 1, updated_at: -1 });

    res.json(items.map((item) => serializeProductReview(item)));
  } catch (error) {
    console.error('Get public product reviews error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/my-feed', protect, async (req, res) => {
  try {
    const filter = {
      ...getVisibleToUserFilter(req.user._id),
    };

    if (req.query.product_id) {
      filter.product_id = req.query.product_id;
    }

    const items = await ProductReview.find(filter)
      .populate('product_id')
      .sort({ product_id: 1, updated_at: -1 });

    res.json(items.map((item) => serializeProductReview(item, req.user._id)));
  } catch (error) {
    console.error('Get user product review feed error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.get('/admin-feed', protect, adminOnly, async (req, res) => {
  try {
    const filter = {};

    if (req.query.product_id) {
      filter.product_id = req.query.product_id;
    }

    if (req.query.scope === 'public' || req.query.scope === 'private') {
      filter.scope = req.query.scope;
    }

    const items = await ProductReview.find(filter)
      .populate('product_id')
      .sort({ updated_at: -1, created_at: -1 });

    res.json(items.map((item) => serializeProductReview(item, req.user._id)));
  } catch (error) {
    console.error('Get admin product review feed error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/my', protect, async (req, res) => {
  try {
    const payload = normalizePrivatePayload(req.body);
    const product = await validateCommonPayload(payload, res);
    if (!product) return;

    if (!userCanReviewProduct(req.user, product)) {
      return res.status(403).json({ error: 'Bạn chỉ có thể đánh giá sản phẩm đã kích hoạt' });
    }

    const authorName =
      (typeof req.user.full_name === 'string' && req.user.full_name.trim()) ||
      (typeof req.user.email === 'string' && req.user.email.split('@')[0]?.trim()) ||
      'Bạn';

    const item = await ProductReview.findOneAndUpdate(
      {
        product_id: payload.product_id,
        user_id: req.user._id,
        scope: 'private',
      },
      {
        $set: {
          product_id: payload.product_id,
          user_id: req.user._id,
          scope: 'private',
          author_name: authorName,
          rating: payload.rating,
          content: payload.content,
          badge: '',
          updated_at: new Date(),
        },
        $setOnInsert: {
          created_at: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    ).populate('product_id');

    res.json(serializeProductReview(item, req.user._id));
  } catch (error) {
    console.error('Save my product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const payload = normalizeAdminPayload(req.body);
    const product = await validateAdminPayload(payload, res);
    if (!product) return;

    const item = await ProductReview.create({
      ...payload,
      scope: 'public',
      user_id: null,
    });
    const populated = await item.populate('product_id');

    res.status(201).json(serializeProductReview(populated, req.user._id));
  } catch (error) {
    console.error('Create product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const payload = normalizeAdminPayload(req.body);
    const product = await validateAdminPayload(payload, res);
    if (!product) return;

    const item = await ProductReview.findByIdAndUpdate(
      req.params.id,
      {
        ...payload,
        scope: 'public',
        user_id: null,
        updated_at: new Date(),
      },
      {
        new: true,
        runValidators: true,
      },
    ).populate('product_id');

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy đánh giá sản phẩm' });
    }

    res.json(serializeProductReview(item, req.user._id));
  } catch (error) {
    console.error('Update product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await ProductReview.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy đánh giá sản phẩm' });
    }

    res.json({ message: 'Đã xóa đánh giá sản phẩm' });
  } catch (error) {
    console.error('Delete product review error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
