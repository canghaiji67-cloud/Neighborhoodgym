const router = require('express').Router();
const { TokenTransaction } = require('../../models');
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

// GET /api/admin/transactions - token transaction log with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const where = {};

    if (req.query.type) {
      where.type = req.query.type;
    }

    if (req.query.address) {
      where[Op.or] = [
        { fromAddress: { [Op.like]: `%${req.query.address}%` } },
        { toAddress: { [Op.like]: `%${req.query.address}%` } },
      ];
    }

    const { rows: list, count: total } = await TokenTransaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.json({ error: false, list, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
