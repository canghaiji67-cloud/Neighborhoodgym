const router = require('express').Router();
const { Op } = require('sequelize');
const { Booking, Course, Coach } = require('../models');
const { authenticateToken } = require('../middleware/auth');

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

// GET /api/bookings - my bookings with pagination
router.get('/', async (req, res, next) => {
  try {
    // Auto-cancel stale pending_payment bookings (30 min timeout)
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
    await Booking.update(
      { status: 'cancelled' },
      {
        where: {
          user_id: req.user.id,
          status: 'pending_payment',
          createdAt: { [Op.lt]: thirtyMinAgo },
        },
      }
    );

    const { page, pageSize, offset } = parsePagination(req.query);

    const { rows: list, count: total } = await Booking.findAndCountAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Course,
          as: 'course',
          include: [{ model: Coach, as: 'coach', attributes: ['id', 'name'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    // Dynamically mark expired bookings (course already started but not checked in)
    const now = new Date();
    const processedList = list.map((b) => {
      const data = b.toJSON();
      if (
        data.status === 'booked' &&
        data.course &&
        data.course.startTime &&
        new Date(data.course.startTime) < now
      ) {
        data.status = 'expired';
      }
      return data;
    });

    res.json({ error: false, list: processedList, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
