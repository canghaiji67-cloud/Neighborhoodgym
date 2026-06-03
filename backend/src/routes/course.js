const router = require('express').Router();
const { Op } = require('sequelize');
const {
  Course,
  Coach,
  Booking,
  CourseReview,
  User,
  sequelize,
} = require('../models');
const { authenticateToken } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');

router.use(authenticateToken);

// Helper: pagination
function parsePagination(query) {
  let page = parseInt(query.page, 10) || 1;
  let pageSize = parseInt(query.pageSize, 10) || 10;
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  if (pageSize > 50) pageSize = 50;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// Helper: auto-cancel stale pending_payment bookings (30 min timeout)
async function autoCancelStaleBookings() {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const stale = await Booking.findAll({
    where: {
      status: 'pending_payment',
      createdAt: { [Op.lt]: thirtyMinAgo },
    },
    include: [{ model: Course, as: 'course' }],
  });

  for (const booking of stale) {
    booking.status = 'cancelled';
    await booking.save();
    // Release capacity
    if (booking.course) {
      await Course.decrement('enrolledCount', {
        by: 1,
        where: { id: booking.course.id, enrolledCount: { [Op.gt]: 0 } },
      });
    }
  }
}

// GET /api/courses - course list with pagination and filters
router.get('/', async (req, res, next) => {
  try {
    await autoCancelStaleBookings();
    const { page, pageSize, offset } = parsePagination(req.query);
    const where = { status: 'active' };

    if (req.query.category) {
      where.category = req.query.category;
    }

    if (req.query.difficulty) {
      where.difficulty = req.query.difficulty;
    }

    // timeRange filter: 'today' | 'week' | 'month'
    if (req.query.timeRange) {
      const now = new Date();
      let endDate;
      if (req.query.timeRange === 'today') {
        endDate = new Date(now);
        endDate.setHours(23, 59, 59, 999);
        where.startTime = { [Op.between]: [now, endDate] };
      } else if (req.query.timeRange === 'week') {
        endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        where.startTime = { [Op.between]: [now, endDate] };
      } else if (req.query.timeRange === 'month') {
        endDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        where.startTime = { [Op.between]: [now, endDate] };
      }
    }

    const { rows: list, count: total } = await Course.findAndCountAll({
      where,
      include: [{ model: Coach, as: 'coach', attributes: ['id', 'name', 'avatar'] }],
      order: [['start_time', 'ASC']],
      limit: pageSize,
      offset,
    });

    res.json({ error: false, list, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// GET /api/courses/:id - course detail
router.get('/:id', async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id, {
      include: [
        { model: Coach, as: 'coach', attributes: ['id', 'name', 'avatar', 'specialties', 'bio'] },
        {
          model: CourseReview,
          as: 'courseReviews',
          include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] }],
          order: [['created_at', 'DESC']],
        },
      ],
    });

    if (!course) {
      return res.status(404).json({
        error: true,
        message: '课程不存在',
        code: 'NOT_FOUND',
      });
    }

    // Check if current user has booked
    const userBooking = await Booking.findOne({
      where: { user_id: req.user.id, course_id: course.id },
      order: [['created_at', 'DESC']],
    });

    const data = course.toJSON();
    data.userBooking = userBooking;

    res.json({ error: false, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/:id/book - book a course
router.post('/:id/book', async (req, res, next) => {
  try {
    const course = await Course.findByPk(req.params.id);
    if (!course || course.status !== 'active') {
      return res.status(404).json({
        error: true,
        message: '课程不存在或已下架',
        code: 'COURSE_NOT_AVAILABLE',
      });
    }

    // Check capacity
    if (course.enrolledCount >= course.maxCapacity) {
      return res.status(400).json({
        error: true,
        message: '课程名额已满',
        code: 'COURSE_FULL',
      });
    }

    // Check if already has active booking
    const existingBooking = await Booking.findOne({
      where: {
        user_id: req.user.id,
        course_id: course.id,
        status: { [Op.in]: ['booked', 'pending_payment'] },
      },
    });
    if (existingBooking) {
      return res.status(409).json({
        error: true,
        message: '您已预约该课程',
        code: 'ALREADY_BOOKED',
      });
    }

    // Determine if free or paid
    const isFree = !course.fitTokenCost || parseFloat(course.fitTokenCost) === 0;

    const result = await sequelize.transaction(async (t) => {
      const status = isFree ? 'booked' : 'pending_payment';
      const booking = await Booking.create(
        {
          userId: req.user.id,
          courseId: course.id,
          status,
        },
        { transaction: t }
      );

      await Course.increment('enrolledCount', {
        by: 1,
        where: { id: course.id },
        transaction: t,
      });

      return booking;
    });

    res.json({ error: false, data: result });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/:id/cancel - cancel booking
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const booking = await Booking.findOne({
      where: {
        user_id: req.user.id,
        course_id: req.params.id,
        status: { [Op.in]: ['booked', 'pending_payment'] },
      },
      include: [{ model: Course, as: 'course' }],
    });

    if (!booking) {
      return res.status(404).json({
        error: true,
        message: '未找到可取消的预约',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // Check if course starts within 2 hours
    if (booking.course && booking.course.startTime) {
      const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
      if (new Date(booking.course.startTime) <= twoHoursFromNow) {
        return res.status(400).json({
          error: true,
          message: '课程开始前 2 小时内无法取消',
          code: 'CANCEL_TOO_LATE',
        });
      }
    }

    await sequelize.transaction(async (t) => {
      booking.status = 'cancelled';
      await booking.save({ transaction: t });

      await Course.decrement('enrolledCount', {
        by: 1,
        where: { id: booking.courseId, enrolledCount: { [Op.gt]: 0 } },
        transaction: t,
      });
    });

    res.json({ error: false, data: booking });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/:id/confirm-payment - confirm FitToken payment
router.post('/:id/confirm-payment', async (req, res, next) => {
  try {
    const { txHash } = req.body;
    if (!txHash) {
      return res.status(400).json({
        error: true,
        message: 'txHash 为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    const booking = await Booking.findOne({
      where: {
        user_id: req.user.id,
        course_id: req.params.id,
        status: 'pending_payment',
      },
      include: [{ model: Course, as: 'course' }],
    });

    if (!booking) {
      return res.status(404).json({
        error: true,
        message: '未找到待支付的预约',
        code: 'BOOKING_NOT_FOUND',
      });
    }

    // Check duplicate txHash
    const dupBooking = await Booking.findOne({ where: { txHash } });
    if (dupBooking) {
      return res.status(409).json({
        error: true,
        message: '该交易已提交过',
        code: 'DUPLICATE_TX',
      });
    }

    const user = await User.findByPk(req.user.id, { attributes: ['walletAddress'] });

    // Verify the FitToken transfer transaction on chain
    try {
      await blockchainService.verifyTransaction(txHash, {
        from: user.walletAddress,
      });
    } catch (err) {
      return res.status(400).json({
        error: true,
        message: `交易验证失败: ${err.message}`,
        code: 'TX_VERIFY_FAILED',
      });
    }

    // Update booking status
    booking.status = 'booked';
    booking.txHash = txHash;
    await booking.save();

    // Record token transaction
    try {
      await blockchainService.parseAndRecordTransferEvents(txHash, 'course_payment');
    } catch (err) {
      console.error('[course] Failed to record token transaction:', err.message);
    }

    res.json({ error: false, data: booking });
  } catch (err) {
    next(err);
  }
});

// POST /api/courses/:id/review - review a course
router.post('/:id/review', async (req, res, next) => {
  try {
    const { rating, content } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        error: true,
        message: '评分必须在 1-5 之间',
        code: 'INVALID_RATING',
      });
    }

    const course = await Course.findByPk(req.params.id);
    if (!course) {
      return res.status(404).json({
        error: true,
        message: '课程不存在',
        code: 'NOT_FOUND',
      });
    }

    // Check if user has checked-in booking for this course
    const booking = await Booking.findOne({
      where: {
        user_id: req.user.id,
        course_id: course.id,
        status: 'checked_in',
      },
    });
    if (!booking) {
      return res.status(400).json({
        error: true,
        message: '只有已签到的课程才能评价',
        code: 'NOT_CHECKED_IN',
      });
    }

    // Check if already reviewed
    const existing = await CourseReview.findOne({
      where: { user_id: req.user.id, course_id: course.id },
    });
    if (existing) {
      return res.status(409).json({
        error: true,
        message: '您已评价过该课程',
        code: 'ALREADY_REVIEWED',
      });
    }

    const review = await CourseReview.create({
      userId: req.user.id,
      courseId: course.id,
      coachId: course.coachId,
      rating,
      content: content || '',
    });

    res.json({ error: false, data: review });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
