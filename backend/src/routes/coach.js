const router = require('express').Router();
const { Op } = require('sequelize');
const {
  Coach,
  CoachFavorite,
  Course,
  CourseReview,
  User,
} = require('../models');
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

// GET /api/coaches/favorites - my favorite coaches (must be before /:id)
router.get('/favorites', async (req, res, next) => {
  try {
    const favorites = await CoachFavorite.findAll({
      where: { user_id: req.user.id },
      include: [
        {
          model: Coach,
          as: 'coach',
          attributes: ['id', 'name', 'phone', 'specialties', 'bio', 'avatar', 'status', 'isRecommended'],
        },
      ],
      order: [['created_at', 'DESC']],
    });

    const list = favorites.map((f) => f.coach).filter(Boolean);
    res.json({ error: false, data: list });
  } catch (err) {
    next(err);
  }
});

// GET /api/coaches - coach list with optional specialty filter
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const where = { status: 'active' };

    if (req.query.specialty) {
      where.specialties = { [Op.like]: `%${req.query.specialty}%` };
    }

    const { rows: coaches, count: total } = await Coach.findAndCountAll({
      where,
      order: [['id', 'ASC']],
      limit: pageSize,
      offset,
    });

    // Attach favorite status for current user
    const favoriteCoachIds = (
      await CoachFavorite.findAll({
        where: { user_id: req.user.id },
        attributes: ['coach_id'],
        raw: true,
      })
    ).map((f) => f.coach_id);

    const list = coaches.map((c) => {
      const data = c.toJSON();
      data.isFavorited = favoriteCoachIds.includes(c.id);
      return data;
    });

    res.json({ error: false, list, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// GET /api/coaches/:id - coach detail with favorite status
router.get('/:id', async (req, res, next) => {
  try {
    const coach = await Coach.findByPk(req.params.id, {
      include: [
        {
          model: Course,
          as: 'courses',
          where: { status: 'active' },
          required: false,
        },
        {
          model: CourseReview,
          as: 'courseReviews',
          include: [{ model: User, as: 'user', attributes: ['id', 'nickname', 'avatar'] }],
          order: [['created_at', 'DESC']],
          limit: 20,
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

    // Favorite status
    const fav = await CoachFavorite.findOne({
      where: { user_id: req.user.id, coach_id: coach.id },
    });

    // Average rating
    const allReviews = await CourseReview.findAll({
      where: { coach_id: coach.id },
      attributes: ['rating'],
      raw: true,
    });
    const avgRating =
      allReviews.length > 0
        ? (allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length).toFixed(1)
        : null;

    const data = coach.toJSON();
    data.isFavorited = !!fav;
    data.averageRating = avgRating ? parseFloat(avgRating) : null;
    data.reviewCount = allReviews.length;

    res.json({ error: false, data });
  } catch (err) {
    next(err);
  }
});

// POST /api/coaches/:id/favorite - toggle favorite
router.post('/:id/favorite', async (req, res, next) => {
  try {
    const coach = await Coach.findByPk(req.params.id);
    if (!coach) {
      return res.status(404).json({
        error: true,
        message: '教练不存在',
        code: 'NOT_FOUND',
      });
    }

    const existing = await CoachFavorite.findOne({
      where: { user_id: req.user.id, coach_id: coach.id },
    });

    if (existing) {
      await existing.destroy();
      return res.json({ error: false, data: { favorited: false } });
    }

    await CoachFavorite.create({
      userId: req.user.id,
      coachId: coach.id,
    });

    res.json({ error: false, data: { favorited: true } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
