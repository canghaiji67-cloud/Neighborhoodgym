const router = require('express').Router();
const { Achievement } = require('../../models');

// GET /api/admin/achievements - achievement list
router.get('/', async (req, res, next) => {
  try {
    const list = await Achievement.findAll({
      order: [['id', 'ASC']],
    });
    res.json({ error: false, data: list });
  } catch (err) {
    next(err);
  }
});

// POST /api/admin/achievements - create achievement definition
router.post('/', async (req, res, next) => {
  try {
    const {
      name,
      description,
      conditionType,
      conditionValue,
      badgeImageCid,
      metadataCid,
      rarity,
    } = req.body;

    if (!name || !conditionType || conditionValue === undefined) {
      return res.status(400).json({
        error: true,
        message: '成就名称、条件类型和条件值为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    if (!['checkin_total', 'checkin_streak', 'course_complete'].includes(conditionType)) {
      return res.status(400).json({
        error: true,
        message: '条件类型无效，必须为 checkin_total、checkin_streak 或 course_complete',
        code: 'INVALID_CONDITION_TYPE',
      });
    }

    const achievement = await Achievement.create({
      name,
      description: description || '',
      conditionType,
      conditionValue: parseInt(conditionValue, 10),
      badgeImageCid: badgeImageCid || null,
      metadataCid: metadataCid || null,
      rarity: rarity || 'common',
    });

    res.json({ error: false, data: achievement });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/achievements/:id - edit achievement
router.put('/:id', async (req, res, next) => {
  try {
    const achievement = await Achievement.findByPk(req.params.id);
    if (!achievement) {
      return res.status(404).json({
        error: true,
        message: '成就不存在',
        code: 'NOT_FOUND',
      });
    }

    const fields = [
      'name', 'description', 'conditionType', 'conditionValue',
      'badgeImageCid', 'metadataCid', 'rarity',
    ];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        achievement[field] = req.body[field];
      }
    }

    await achievement.save();
    res.json({ error: false, data: achievement });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/admin/achievements/:id - delete achievement
router.delete('/:id', async (req, res, next) => {
  try {
    const { UserAchievement } = require('../../models');
    const achievement = await Achievement.findByPk(req.params.id);
    if (!achievement) {
      return res.status(404).json({
        error: true,
        message: '成就不存在',
        code: 'NOT_FOUND',
      });
    }

    // Check if any user has claimed this achievement
    const claimedCount = await UserAchievement.count({
      where: { achievement_id: req.params.id },
    });
    if (claimedCount > 0) {
      return res.status(400).json({
        error: true,
        message: `该成就已被 ${claimedCount} 位用户领取，无法删除`,
        code: 'HAS_CLAIMS',
      });
    }

    await achievement.destroy();
    res.json({ error: false, message: '成就已删除' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
