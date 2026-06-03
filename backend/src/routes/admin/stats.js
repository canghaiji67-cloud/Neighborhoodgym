const router = require('express').Router();
const {
  User,
  Membership,
  Course,
  Booking,
  CheckIn,
  Coach,
  TokenTransaction,
  UserAchievement,
} = require('../../models');
const { Op } = require('sequelize');

// GET /api/admin/stats - dashboard statistics
router.get('/', async (req, res, next) => {
  try {
    const totalUsers = await User.count();
    const totalCoaches = await Coach.count({ where: { status: 'active' } });
    const totalCourses = await Course.count({ where: { status: 'active' } });
    const totalBookings = await Booking.count();
    const totalCheckins = await CheckIn.count();
    const totalAchievementsClaimed = await UserAchievement.count();

    // Active memberships (not expired)
    const now = new Date();
    const activeMemberships = await Membership.count({
      where: { expiresAt: { [Op.gt]: now } },
    });

    // Today's check-ins
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCheckins = await CheckIn.count({
      where: { checkInDate: { [Op.gte]: today } },
    });

    // This week's bookings
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weekBookings = await Booking.count({
      where: { createdAt: { [Op.gte]: weekAgo } },
    });

    // Token transaction stats
    const tokenTxCount = await TokenTransaction.count();

    res.json({
      error: false,
      data: {
        totalUsers,
        totalCoaches,
        totalCourses,
        totalBookings,
        totalCheckins,
        totalAchievementsClaimed,
        activeMemberships,
        todayCheckins,
        weekBookings,
        tokenTxCount,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/admin/stats/trends - daily trends for charts (last 7 days)
router.get('/trends', async (req, res, next) => {
  try {
    const days = 7;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      const dateLabel = `${dayStart.getMonth() + 1}/${dayStart.getDate()}`;

      const checkins = await CheckIn.count({
        where: { checkInDate: { [Op.between]: [dayStart, dayEnd] } },
      });

      const bookings = await Booking.count({
        where: { createdAt: { [Op.between]: [dayStart, dayEnd] } },
      });

      const newUsers = await User.count({
        where: { createdAt: { [Op.between]: [dayStart, dayEnd] } },
      });

      result.push({ date: dateLabel, checkins, bookings, newUsers });
    }

    // Course category distribution
    const courses = await Course.findAll({
      where: { status: 'active' },
      attributes: ['category'],
      raw: true,
    });
    const categoryMap = {};
    courses.forEach((c) => {
      categoryMap[c.category] = (categoryMap[c.category] || 0) + 1;
    });
    const courseCategories = Object.entries(categoryMap).map(([name, value]) => ({
      name,
      value,
    }));

    res.json({
      error: false,
      data: { daily: result, courseCategories },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
