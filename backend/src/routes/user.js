const router = require('express').Router();
const { User, Membership, CheckIn, Booking } = require('../models');
const { authenticateToken } = require('../middleware/auth');
const { uploadAvatar, handleMulterError } = require('../middleware/upload');
const blockchainService = require('../services/blockchainService');
const { Op } = require('sequelize');

// All routes require JWT
router.use(authenticateToken);

// Helper: calculate member level
function calculateMemberLevel(checkinCount, courseCompleteCount) {
  if (checkinCount >= 300 && courseCompleteCount >= 100) return 'diamond';
  if (checkinCount >= 100 && courseCompleteCount >= 30) return 'gold';
  if (checkinCount >= 30 || courseCompleteCount >= 10) return 'silver';
  return 'normal';
}

// GET /api/user/profile
router.get('/profile', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['nonce'] },
    });
    if (!user) {
      return res.status(404).json({
        error: true,
        message: '用户不存在',
        code: 'NOT_FOUND',
      });
    }

    // Recalculate member level
    const checkinCount = await CheckIn.count({ where: { user_id: user.id } });
    const courseCompleteCount = await Booking.count({
      where: { user_id: user.id, status: 'checked_in' },
    });
    const newLevel = calculateMemberLevel(checkinCount, courseCompleteCount);
    if (newLevel !== user.memberLevel) {
      user.memberLevel = newLevel;
      await user.save();
    }

    // Get on-chain FitToken balance
    let fitTokenBalance = '0';
    try {
      fitTokenBalance = await blockchainService.getFitTokenBalance(user.walletAddress);
    } catch (_) {
      // blockchain may be unavailable
    }

    const userData = user.toJSON();
    delete userData.nonce;
    userData.fitTokenBalance = fitTokenBalance;
    userData.checkinCount = checkinCount;
    userData.courseCompleteCount = courseCompleteCount;

    res.json({ error: false, data: userData });
  } catch (err) {
    next(err);
  }
});

// PUT /api/user/profile
router.put('/profile', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({
        error: true,
        message: '用户不存在',
        code: 'NOT_FOUND',
      });
    }

    const { nickname, phone, avatar } = req.body;
    if (nickname !== undefined) user.nickname = nickname;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    await user.save();

    const userData = user.toJSON();
    delete userData.nonce;

    res.json({ error: false, data: userData });
  } catch (err) {
    next(err);
  }
});

// POST /api/user/avatar - upload avatar image
router.post('/avatar', uploadAvatar.single('file'), handleMulterError, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: '请选择要上传的图片',
        code: 'NO_FILE',
      });
    }

    const avatarUrl = `uploads/avatars/${req.file.filename}`;
    const user = await User.findByPk(req.user.id);
    user.avatar = avatarUrl;
    await user.save();

    res.json({ error: false, data: { url: avatarUrl } });
  } catch (err) {
    next(err);
  }
});

// GET /api/user/membership
router.get('/membership', async (req, res, next) => {
  try {
    const user = await User.findByPk(req.user.id, { attributes: ['walletAddress'] });
    if (!user) {
      return res.status(404).json({
        error: true,
        message: '用户不存在',
        code: 'NOT_FOUND',
      });
    }

    // Get latest membership from MySQL
    const membership = await Membership.findOne({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    // Get on-chain membership info
    let onChainInfo = null;
    try {
      onChainInfo = await blockchainService.getMembershipInfo(user.walletAddress);
    } catch (_) {
      // blockchain may be unavailable
    }

    // All membership history
    const history = await Membership.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });

    res.json({
      error: false,
      data: {
        current: membership,
        onChain: onChainInfo,
        history,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/user/membership - submit membership purchase/renewal txHash
router.post('/membership', async (req, res, next) => {
  try {
    const { txHash, planType, amount } = req.body;
    if (!txHash) {
      return res.status(400).json({
        error: true,
        message: 'txHash 为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    // Check for duplicate txHash
    const existing = await Membership.findOne({ where: { txHash } });
    if (existing) {
      return res.status(409).json({
        error: true,
        message: '该交易已提交过',
        code: 'DUPLICATE_TX',
      });
    }

    const user = await User.findByPk(req.user.id, { attributes: ['walletAddress'] });

    // Verify transaction on chain
    try {
      await blockchainService.verifyTransaction(txHash, {
        from: user.walletAddress,
        to: process.env.MEMBERSHIP_CONTRACT_ADDRESS,
      });
    } catch (err) {
      return res.status(400).json({
        error: true,
        message: `交易验证失败: ${err.message}`,
        code: 'TX_VERIFY_FAILED',
      });
    }

    // Create membership record
    const membership = await Membership.create({
      userId: req.user.id,
      planType: planType || 1,
      amount: amount || '0',
      txHash,
      purchasedAt: new Date(),
      expiresAt: new Date(Date.now() + getPlanDuration(planType || 1)),
    });

    res.json({ error: false, data: membership });
  } catch (err) {
    next(err);
  }
});

// Helper: get plan duration in milliseconds
function getPlanDuration(planType) {
  const DURATIONS = {
    1: 30 * 24 * 60 * 60 * 1000, // monthly: 30 days
    2: 90 * 24 * 60 * 60 * 1000, // quarterly: 90 days
    3: 365 * 24 * 60 * 60 * 1000, // yearly: 365 days
  };
  return DURATIONS[planType] || DURATIONS[1];
}

module.exports = router;
