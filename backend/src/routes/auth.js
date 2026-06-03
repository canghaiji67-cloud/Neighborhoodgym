const router = require('express').Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { ethers } = require('ethers');
const { User, CheckIn, Booking } = require('../models');
const blockchainService = require('../services/blockchainService');

const SIGN_MESSAGE_PREFIX =
  'Welcome to GymChain! Sign this message to verify your identity.\n\nNonce: ';

// Helper: calculate member level
function calculateMemberLevel(checkinCount, courseCompleteCount) {
  if (checkinCount >= 300 && courseCompleteCount >= 100) return 'diamond';
  if (checkinCount >= 100 && courseCompleteCount >= 30) return 'gold';
  if (checkinCount >= 30 || courseCompleteCount >= 10) return 'silver';
  return 'normal';
}

// GET /api/auth/nonce?walletAddress=0x...
router.get('/nonce', async (req, res, next) => {
  try {
    const { walletAddress } = req.query;
    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      return res.status(400).json({
        error: true,
        message: '无效的钱包地址',
        code: 'INVALID_ADDRESS',
      });
    }

    const addr = walletAddress.toLowerCase();
    const nonce = crypto.randomBytes(32).toString('hex');

    let user = await User.findOne({ where: { walletAddress: addr } });
    if (!user) {
      user = await User.create({ walletAddress: addr, nonce });
    } else {
      user.nonce = nonce;
      await user.save();
    }

    res.json({ error: false, data: { nonce } });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { walletAddress, signature } = req.body;
    if (!walletAddress || !signature) {
      return res.status(400).json({
        error: true,
        message: '缺少钱包地址或签名',
        code: 'MISSING_PARAMS',
      });
    }

    const addr = walletAddress.toLowerCase();
    const user = await User.findOne({ where: { walletAddress: addr } });
    if (!user || !user.nonce) {
      return res.status(400).json({
        error: true,
        message: '请先获取 nonce',
        code: 'NONCE_NOT_FOUND',
      });
    }

    // Verify signature
    const message = SIGN_MESSAGE_PREFIX + user.nonce;
    let recoveredAddress;
    try {
      recoveredAddress = ethers.verifyMessage(message, signature);
    } catch (e) {
      return res.status(400).json({
        error: true,
        message: '签名验证失败',
        code: 'INVALID_SIGNATURE',
      });
    }

    if (recoveredAddress.toLowerCase() !== addr) {
      return res.status(401).json({
        error: true,
        message: '签名地址不匹配',
        code: 'SIGNATURE_MISMATCH',
      });
    }

    // Invalidate nonce (one-time use)
    user.nonce = crypto.randomBytes(32).toString('hex');
    await user.save();

    // Check if user has completed registration (has nickname)
    const needRegister = !user.nickname;

    if (needRegister) {
      return res.json({
        error: false,
        data: { token: null, user: null, needRegister: true, walletAddress: addr },
      });
    }

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      error: false,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          role: user.role,
          memberLevel: user.memberLevel,
        },
        needRegister: false,
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { walletAddress, nickname, phone, txHash } = req.body;
    if (!walletAddress || !nickname) {
      return res.status(400).json({
        error: true,
        message: '钱包地址和昵称为必填项',
        code: 'MISSING_PARAMS',
      });
    }

    const addr = walletAddress.toLowerCase();
    const user = await User.findOne({ where: { walletAddress: addr } });
    if (!user) {
      return res.status(400).json({
        error: true,
        message: '请先获取 nonce 并完成签名登录',
        code: 'USER_NOT_FOUND',
      });
    }

    if (user.nickname) {
      return res.status(409).json({
        error: true,
        message: '该钱包地址已注册',
        code: 'ALREADY_REGISTERED',
      });
    }

    // Verify on-chain registration txHash if provided
    if (txHash) {
      try {
        await blockchainService.verifyTransaction(txHash, {
          from: addr,
          to: process.env.MEMBERSHIP_CONTRACT_ADDRESS,
        });
      } catch (err) {
        return res.status(400).json({
          error: true,
          message: `链上注册交易验证失败: ${err.message}`,
          code: 'TX_VERIFY_FAILED',
        });
      }
    }

    // Update user profile
    user.nickname = nickname;
    if (phone) user.phone = phone;
    await user.save();

    // Issue JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, walletAddress: user.walletAddress },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      error: false,
      data: {
        token,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          role: user.role,
          memberLevel: user.memberLevel,
        },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
