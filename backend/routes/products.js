const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect, adminOnly } = require('../middleware/auth');

function serializeProduct(item) {
  return {
    id: item._id,
    key: item.key,
    name: item.name,
    image_url: item.image_url || '',
    purchase_link: item.purchase_link || '',
    is_active: item.is_active,
    created_at: item.created_at,
    updated_at: item.updated_at,
  };
}

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const items = await Product.find({ is_active: true }).sort({ created_at: 1 });
    res.json(items.map(serializeProduct));
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// POST /api/products
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const item = await Product.create(req.body);
    res.status(201).json(serializeProduct(item));
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// PUT /api/products/:id
router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updated_at: new Date() },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    res.json(serializeProduct(item));
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await Product.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }

    res.json({ message: 'Đã xóa' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

module.exports = router;
