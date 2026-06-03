const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const achievementService = require('../services/achievementService');

router.use(authenticateToken);

// GET /api/achievements/badges - my badge list (must be before /:id)
router.get('/badges', async (req, res, next) => {
  try {
    const badges = await achievementService.getUserBadges(req.user.id);
    res.json({ error: false, data: badges });
  } catch (err) {
    next(err);
  }
});

// GET /api/achievements - achievement list with claim status
router.get('/', async (req, res, next) => {
  try {
    const achievements = await achievementService.getAchievementsWithStatus(req.user.id);
    res.json({ error: false, data: achievements });
  } catch (err) {
    next(err);
  }
});

// POST /api/achievements/:id/claim - claim achievement NFT
router.post('/:id/claim', async (req, res, next) => {
  try {
    const result = await achievementService.claimAchievement(
      req.user.id,
      parseInt(req.params.id, 10)
    );
    res.json({ error: false, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
