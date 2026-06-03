const router = require('express').Router();
const {
  GymInfo,
  Carousel,
  Course,
  Coach,
  Announcement,
  GalleryImage,
  CourseReview,
} = require('../models');
const { Op } = require('sequelize');

// GET /api/homepage - aggregated homepage data
router.get('/', async (req, res, next) => {
  try {
    // Gym info
    const gymInfo = await GymInfo.findOne();

    // Enabled carousels sorted by sortOrder
    const carousels = await Carousel.findAll({
      where: { isEnabled: true },
      order: [['sort_order', 'ASC']],
    });

    // Hot courses: active courses sorted by enrolled count, top 6
    const hotCourses = await Course.findAll({
      where: { status: 'active' },
      include: [{ model: Coach, as: 'coach', attributes: ['id', 'name', 'avatar'] }],
      order: [['enrolled_count', 'DESC']],
      limit: 6,
    });

    // Recommended coaches: is_recommended=true, status=active
    const recommendedCoachRows = await Coach.findAll({
      where: { isRecommended: true, status: 'active' },
      order: [['id', 'ASC']],
      limit: 8,
    });
    const recommendedCoaches = await Promise.all(
      recommendedCoachRows.map(async (coach) => {
        const coachData = coach.toJSON();
        const [courseCount, reviews] = await Promise.all([
          Course.count({ where: { coach_id: coach.id, status: 'active' } }),
          CourseReview.findAll({
            where: { coach_id: coach.id },
            attributes: ['rating'],
            raw: true,
          }),
        ]);
        const avgRating =
          reviews.length > 0
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
            : null;
        coachData.courseCount = courseCount;
        coachData.averageRating = avgRating ? parseFloat(avgRating) : null;
        coachData.reviewCount = reviews.length;
        return coachData;
      })
    );

    // Recent published announcements, top 5, pinned first
    const announcements = await Announcement.findAll({
      where: { status: 'published' },
      order: [
        ['is_pinned', 'DESC'],
        ['created_at', 'DESC'],
      ],
      limit: 5,
    });

    // Gallery images sorted by sortOrder
    const galleryImages = await GalleryImage.findAll({
      order: [['sort_order', 'ASC']],
    });

    res.json({
      error: false,
      data: {
        gymInfo,
        carousels,
        hotCourses,
        recommendedCoaches,
        announcements,
        galleryImages,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/homepage/announcements/:id - announcement detail
router.get('/announcements/:id', async (req, res, next) => {
  try {
    const announcement = await Announcement.findOne({
      where: { id: req.params.id, status: 'published' },
    });
    if (!announcement) {
      return res.status(404).json({
        error: true,
        message: '公告不存在',
        code: 'NOT_FOUND',
      });
    }
    res.json({ error: false, data: announcement });
  } catch (err) {
    next(err);
  }
});

// GET /api/homepage/coaches/:id - public coach detail (with courses, no favorite status)
router.get('/coaches/:id', async (req, res, next) => {
  try {
    const coach = await Coach.findOne({
      where: { id: req.params.id, status: 'active' },
      include: [
        {
          model: Course,
          as: 'courses',
          where: { status: 'active' },
          required: false,
          order: [['start_time', 'ASC']],
        },
      ],
    });
    if (!coach) {
      return res.status(404).json({
        error: true,
        message: '教练不存在',
        code: 'NOT_FOUND',
      });
    }

    // Get average rating for this coach
    const reviews = await CourseReview.findAll({
      where: { coach_id: coach.id },
      attributes: ['rating'],
      raw: true,
    });
    const avgRating =
      reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : null;

    const coachData = coach.toJSON();
    coachData.averageRating = avgRating ? parseFloat(avgRating) : null;
    coachData.reviewCount = reviews.length;

    res.json({ error: false, data: coachData });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
