const router = require('express').Router();
const { Coach } = require('../../models');
const { uploadCoach, handleMulterError } = require('../../middleware/upload');
const { Op } = require('sequelize');

// Helper: pagination
function parsePagination(query) {
  let page = parseInt(query.page, 10) || 1;
  let pageSize = parseInt(query.pageSize, 10) || 10;
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  if (pageSize > 50) pageSize = 50;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// GET /api/admin/coaches - coach list with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    if (req.query.search) {
      where.name = { [Op.like]: `%${req.query.search}%` };
    }

    const { rows: list, count: total } = await Coach.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      limit: pageSize,
      offset,
    });

    res.json({ error: false, list, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/coaches - add coach
router.post('/', uploadCoach.single('file'), handleMulterError, async (req, res, next) => {
  try {
    const { name, phone, specialties, bio } = req.body;
    if (!name) {
      return res.status(400).json({
        error: true,
        message: '教练姓名为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    const avatar = req.file ? `uploads/coaches/${req.file.filename}` : null;

    const coach = await Coach.create({
      name,
      phone: phone || null,
      specialties: specialties || null,
      bio: bio || null,
      avatar,
      status: 'active',
      isRecommended: false,
    });

    res.json({ error: false, data: coach });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/coaches/:id - edit coach
router.put('/:id', uploadCoach.single('file'), handleMulterError, async (req, res, next) => {
  try {
    const coach = await Coach.findByPk(req.params.id);
    if (!coach) {
      return res.status(404).json({
        error: true,
        message: '教练不存在',
        code: 'NOT_FOUND',
      });
    }

    const { name, phone, specialties, bio } = req.body;
    if (name !== undefined) coach.name = name;
    if (phone !== undefined) coach.phone = phone;
    if (specialties !== undefined) coach.specialties = specialties;
    if (bio !== undefined) coach.bio = bio;
    if (req.file) {
      coach.avatar = `uploads/coaches/${req.file.filename}`;
    }

    await coach.save();
    res.json({ error: false, data: coach });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/coaches/:id/status - toggle coach status (active/inactive)
router.put('/:id/status', async (req, res, next) => {
  try {
    const coach = await Coach.findByPk(req.params.id);
    if (!coach) {
      return res.status(404).json({
        error: true,
        message: '教练不存在',
        code: 'NOT_FOUND',
      });
    }

    const { status } = req.body;
    if (!status || !['active', 'inactive'].includes(status)) {
      return res.status(400).json({
        error: true,
        message: '状态必须为 active 或 inactive',
        code: 'INVALID_STATUS',
      });
    }

    coach.status = status;
    await coach.save();
    res.json({ error: false, data: coach });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/coaches/:id/recommend - toggle recommendation
router.put('/:id/recommend', async (req, res, next) => {
  try {
    const coach = await Coach.findByPk(req.params.id);
    if (!coach) {
      return res.status(404).json({
        error: true,
        message: '教练不存在',
        code: 'NOT_FOUND',
      });
    }

    const { isRecommended } = req.body;
    coach.isRecommended = isRecommended !== undefined ? isRecommended : !coach.isRecommended;
    await coach.save();
    res.json({ error: false, data: coach });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
