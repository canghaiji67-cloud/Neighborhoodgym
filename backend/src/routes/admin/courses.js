const router = require('express').Router();
const { Course, Coach, Booking } = require('../../models');
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

// GET /api/admin/courses - course list with pagination and filters
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }
    if (req.query.category) {
      where.category = req.query.category;
    }
    if (req.query.search) {
      where.title = { [Op.like]: `%${req.query.search}%` };
    }

    const { rows: list, count: total } = await Course.findAndCountAll({
      where,
      include: [{ model: Coach, as: 'coach', attributes: ['id', 'name'] }],
      order: [['start_time', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.json({ error: false, list, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/courses - add course
router.post('/', async (req, res, next) => {
  try {
    const {
      title,
      category,
      coachId,
      startTime,
      endTime,
      location,
      maxCapacity,
      fitTokenCost,
      description,
      difficulty,
      suitableFor,
    } = req.body;

    if (!title || !coachId || !startTime || !endTime) {
      return res.status(400).json({
        error: true,
        message: '课程名称、教练、开始时间、结束时间为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    // Verify coach exists
    const coach = await Coach.findByPk(coachId);
    if (!coach) {
      return res.status(400).json({
        error: true,
        message: '教练不存在',
        code: 'COACH_NOT_FOUND',
      });
    }

    const course = await Course.create({
      title,
      category: category || 'other',
      coachId,
      startTime,
      endTime,
      location: location || '',
      maxCapacity: maxCapacity || 30,
      enrolledCount: 0,
      fitTokenCost: fitTokenCost || 0,
      description: description || '',
      difficulty: difficulty || 'beginner',
      suitableFor: suitableFor || '',
      status: 'active',
    });

    res.json({ error: false, data: course });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/courses/:id - edit course
router.put('/:id', async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({
        error: true,
        message: '课程不存在',
        code: 'NOT_FOUND',
      });
    }

    const fields = [
      'title', 'category', 'coachId', 'startTime', 'endTime',
      'location', 'maxCapacity', 'fitTokenCost', 'description',
      'difficulty', 'suitableFor',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        course[field] = req.body[field];
      }
    }

    await course.save();
    res.json({ error: false, data: course });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/courses/:id - delete course (only if no active bookings)
router.delete('/:id', async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({
        error: true,
        message: '课程不存在',
        code: 'NOT_FOUND',
      });
    }

    // Check for active bookings
    const activeBookings = await Booking.count({
      where: {
        course_id: course.id,
        status: { [Op.in]: ['booked', 'pending_payment'] },
      },
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        error: true,
        message: '该课程有有效预约，无法删除',
        code: 'HAS_ACTIVE_BOOKINGS',
      });
    }

    await course.destroy();
    res.json({ error: false, data: { message: '课程已删除' } });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/courses/:id/status - toggle course status (active/inactive)
router.put('/:id/status', async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({
        error: true,
        message: '课程不存在',
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

    course.status = status;
    await course.save();
    res.json({ error: false, data: course });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
