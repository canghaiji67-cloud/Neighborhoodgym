const router = require('express').Router();
const { CheckIn, User } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const blockchainService = require('../services/blockchainService');
const { Op } = require('sequelize');

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

// POST /api/checkins - submit check-in txHash
router.post('/', async (req, res, next) => {
  try {
    const { txHash, exerciseType, durationMinutes } = req.body;
    if (!txHash) {
      return res.status(400).json({
        error: true,
        message: 'txHash 为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    // Check duplicate txHash
    const existing = await CheckIn.findOne({ where: { txHash } });
    if (existing) {
      return res.status(409).json({
        error: true,
        message: '该打卡交易已提交过',
        code: 'DUPLICATE_TX',
      });
    }

    // Check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayCheckin = await CheckIn.findOne({
      where: {
        user_id: req.user.id,
        checkInDate: { [Op.between]: [today, tomorrow] },
      },
    });
    if (todayCheckin) {
      return res.status(409).json({
        error: true,
        message: '今天已经打卡过了',
        code: 'ALREADY_CHECKED_IN',
      });
    }

    const user = await User.findByPk(req.user.id, { attributes: ['walletAddress'] });

    // Verify transaction on chain
    try {
      await blockchainService.verifyTransaction(txHash, {
        from: user.walletAddress,
        to: process.env.CHECKIN_CONTRACT_ADDRESS,
      });
    } catch (err) {
      return res.status(400).json({
        error: true,
        message: `打卡交易验证失败: ${err.message}`,
        code: 'TX_VERIFY_FAILED',
      });
    }

    // Create check-in record
    const checkin = await CheckIn.create({
      userId: req.user.id,
      checkInDate: new Date(),
      exerciseType: exerciseType || 'general',
      durationMinutes: durationMinutes || 60,
      txHash,
    });

    // Parse and record FitToken reward transfers from this tx
    try {
      await blockchainService.parseAndRecordTransferEvents(txHash, 'checkin_reward');
    } catch (err) {
      console.error('[checkin] Failed to record token transactions:', err.message);
    }

    // Get updated on-chain check-in info
    let onChainInfo = null;
    try {
      onChainInfo = await blockchainService.getCheckInInfo(user.walletAddress);
    } catch (_) {
      // blockchain may be unavailable
    }

    res.json({
      error: false,
      data: {
        checkin,
        onChainInfo,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/checkins - my check-in records with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);

    const { rows: list, count: total } = await CheckIn.findAndCountAll({
      where: { user_id: req.user.id },
      order: [['check_in_date', 'DESC']],
      limit: pageSize,
      offset,
    });

    // Also return on-chain summary
    const user = await User.findByPk(req.user.id, { attributes: ['walletAddress'] });
    let onChainInfo = null;
    try {
      onChainInfo = await blockchainService.getCheckInInfo(user.walletAddress);
    } catch (_) {
      // blockchain may be unavailable
    }

    res.json({ error: false, list, total, page, pageSize, onChainInfo });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
