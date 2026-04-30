const express = require('express');
const router = express.Router();
const Library = require('../models/Library');

// Lấy danh sách thư viện
router.get('/', async (req, res) => {
  try {
    const items = await Library.find().sort({ created_at: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Thêm mục thư viện mới
router.post('/', async (req, res) => {
  try {
    const { title, category, coverImage, link } = req.body;
    const newItem = new Library({
      title,
      category,
      coverImage,
      link
    });
    await newItem.save();
    res.status(201).json(newItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Cập nhật mục thư viện
router.put('/:id', async (req, res) => {
  try {
    const { title, category, coverImage, link } = req.body;
    const updatedItem = await Library.findByIdAndUpdate(
      req.params.id,
      { title, category, coverImage, link },
      { new: true, runValidators: true }
    );
    if (!updatedItem) return res.status(404).json({ error: 'Không tìm thấy dữ liệu' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Xóa mục thư viện
router.delete('/:id', async (req, res) => {
  try {
    const deletedItem = await Library.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Không tìm thấy dữ liệu' });
    res.json({ message: 'Đã xóa thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
