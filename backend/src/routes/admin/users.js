const router = require('express').Router();
const { User } = require('../../models');
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

// GET /api/admin/users - user list with pagination and search
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const where = {};

    if (req.query.search) {
      where[Op.or] = [
        { nickname: { [Op.like]: `%${req.query.search}%` } },
        { walletAddress: { [Op.like]: `%${req.query.search}%` } },
        { phone: { [Op.like]: `%${req.query.search}%` } },
      ];
    }

    if (req.query.role) {
      where.role = req.query.role;
    }

    const { rows: list, count: total } = await User.findAndCountAll({
      where,
      attributes: { exclude: ['nonce'] },
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.json({ error: false, list, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/users/:id/role - modify user role
router.put('/:id/role', async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!role || !['member', 'admin'].includes(role)) {
      return res.status(400).json({
        error: true,
        message: '角色必须为 member 或 admin',
        code: 'INVALID_ROLE',
      });
    }

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: '用户不存在',
        code: 'NOT_FOUND',
      });
    }

    user.role = role;
    await user.save();

    const data = user.toJSON();
    delete data.nonce;

    res.json({ error: false, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
