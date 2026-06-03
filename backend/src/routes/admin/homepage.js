const router = require('express').Router();
const {
  GymInfo,
  Carousel,
  Announcement,
  GalleryImage,
} = require('../../models');
const { uploadCarousel, uploadGallery, handleMulterError } = require('../../middleware/upload');

// ==================== Gym Info ====================

// GET /api/admin/homepage/gym-info
router.get('/gym-info', async (req, res, next) => {
  try {
    let gymInfo = await GymInfo.findOne();
    if (!gymInfo) {
      gymInfo = await GymInfo.create({
        name: '',
        slogan: '',
        description: '',
        address: '',
        phone: '',
        businessHours: '',
      });
    }
    res.json({ error: false, data: gymInfo });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/homepage/gym-info
router.put('/gym-info', async (req, res, next) => {
  try {
    let gymInfo = await GymInfo.findOne();
    if (!gymInfo) {
      gymInfo = await GymInfo.create(req.body);
    } else {
      const fields = ['name', 'slogan', 'description', 'address', 'phone', 'businessHours'];
      for (const field of fields) {
        if (req.body[field] !== undefined) {
          gymInfo[field] = req.body[field];
        }
      }
      await gymInfo.save();
    }
    res.json({ error: false, data: gymInfo });
  } catch (err) {
    next(err);
  }
});

// ==================== Carousels ====================

// GET /api/admin/homepage/carousels
router.get('/carousels', async (req, res, next) => {
  try {
    const list = await Carousel.findAll({
      order: [['sort_order', 'ASC']],
    });
    res.json({ error: false, data: list });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/homepage/carousels - upload carousel
router.post(
  '/carousels',
  uploadCarousel.single('file'),
  handleMulterError,
  async (req, res, next) => {
    try {
      const imageUrl = req.file
        ? `uploads/carousels/${req.file.filename}`
        : req.body.imageUrl || '';

      if (!imageUrl) {
        return res.status(400).json({
          error: true,
          message: '请上传轮播图图片或提供图片 URL',
          code: 'NO_IMAGE',
        });
      }

      const carousel = await Carousel.create({
        imageUrl,
        linkUrl: req.body.linkUrl || null,
        sortOrder: parseInt(req.body.sortOrder, 10) || 0,
        isEnabled: req.body.isEnabled !== undefined ? req.body.isEnabled : true,
      });

      res.json({ error: false, data: carousel });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/homepage/carousels/:id
router.put('/carousels/:id', async (req, res, next) => {
  try {
    const carousel = await Carousel.findByPk(req.params.id);
    if (!carousel) {
      return res.status(404).json({
        error: true,
        message: '轮播图不存在',
        code: 'NOT_FOUND',
      });
    }

    const fields = ['imageUrl', 'linkUrl', 'sortOrder', 'isEnabled'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        carousel[field] = req.body[field];
      }
    }

    await carousel.save();
    res.json({ error: false, data: carousel });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/homepage/carousels/:id
router.delete('/carousels/:id', async (req, res, next) => {
  try {
    const carousel = await Carousel.findByPk(req.params.id);
    if (!carousel) {
      return res.status(404).json({
        error: true,
        message: '轮播图不存在',
        code: 'NOT_FOUND',
      });
    }
    await carousel.destroy();
    res.json({ error: false, data: { message: '轮播图已删除' } });
  } catch (err) {
    next(err);
  }
});

// ==================== Announcements ====================

// GET /api/admin/homepage/announcements
router.get('/announcements', async (req, res, next) => {
  try {
    const list = await Announcement.findAll({
      order: [
        ['is_pinned', 'DESC'],
        ['created_at', 'DESC'],
      ],
    });
    res.json({ error: false, data: list });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/homepage/announcements
router.post('/announcements', async (req, res, next) => {
  try {
    const { title, content, isPinned, status } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        error: true,
        message: '公告标题和内容为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    const announcement = await Announcement.create({
      title,
      content,
      isPinned: isPinned || false,
      status: status || 'published',
    });

    res.json({ error: false, data: announcement });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/homepage/announcements/:id
router.put('/announcements/:id', async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        error: true,
        message: '公告不存在',
        code: 'NOT_FOUND',
      });
    }

    const fields = ['title', 'content', 'isPinned', 'status'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        announcement[field] = req.body[field];
      }
    }

    await announcement.save();
    res.json({ error: false, data: announcement });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/homepage/announcements/:id
router.delete('/announcements/:id', async (req, res, next) => {
  try {
    const announcement = await Announcement.findByPk(req.params.id);
    if (!announcement) {
      return res.status(404).json({
        error: true,
        message: '公告不存在',
        code: 'NOT_FOUND',
      });
    }
    await announcement.destroy();
    res.json({ error: false, data: { message: '公告已删除' } });
  } catch (err) {
    next(err);
  }
});

// ==================== Gallery Images ====================

// GET /api/admin/homepage/gallery
router.get('/gallery', async (req, res, next) => {
  try {
    const list = await GalleryImage.findAll({
      order: [['sort_order', 'ASC']],
    });
    res.json({ error: false, data: list });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/homepage/gallery - upload gallery image
router.post(
  '/gallery',
  uploadGallery.single('file'),
  handleMulterError,
  async (req, res, next) => {
    try {
      const imageUrl = req.file
        ? `uploads/gallery/${req.file.filename}`
        : req.body.imageUrl || '';

      if (!imageUrl) {
        return res.status(400).json({
          error: true,
          message: '请上传环境图片或提供图片 URL',
          code: 'NO_IMAGE',
        });
      }

      const image = await GalleryImage.create({
        imageUrl,
        description: req.body.description || null,
        sortOrder: parseInt(req.body.sortOrder, 10) || 0,
      });

      res.json({ error: false, data: image });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/admin/homepage/gallery/:id
router.put('/gallery/:id', async (req, res, next) => {
  try {
    const image = await GalleryImage.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({
        error: true,
        message: '图片不存在',
        code: 'NOT_FOUND',
      });
    }

    const fields = ['imageUrl', 'description', 'sortOrder'];
    for (const field of fields) {
      if (req.body[field] !== undefined) {
        image[field] = req.body[field];
      }
    }

    await image.save();
    res.json({ error: false, data: image });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/homepage/gallery/:id
router.delete('/gallery/:id', async (req, res, next) => {
  try {
    const image = await GalleryImage.findByPk(req.params.id);
    if (!image) {
      return res.status(404).json({
        error: true,
        message: '图片不存在',
        code: 'NOT_FOUND',
      });
    }
    await image.destroy();
    res.json({ error: false, data: { message: '图片已删除' } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
