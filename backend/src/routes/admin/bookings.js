const router = require('express').Router();
const { Booking, Course, Coach, User, sequelize } = require('../../models');
const { Op } = require('sequelize');
const blockchainService = require('../../services/blockchainService');

// Helper: pagination
function parsePagination(query) {
  let page = parseInt(query.page, 10) || 1;
  let pageSize = parseInt(query.pageSize, 10) || 10;
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = 10;
  if (pageSize > 50) pageSize = 50;
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// GET /api/admin/bookings - booking list with pagination
router.get('/', async (req, res, next) => {
  try {
    const { page, pageSize, offset } = parsePagination(req.query);
    const where = {};

    if (req.query.status) {
      where.status = req.query.status;
    }

    const { rows: list, count: total } = await Booking.findAndCountAll({
      where,
      include: [
        { model: User, as: 'user', attributes: ['id', 'nickname', 'walletAddress'] },
        {
          model: Course,
          as: 'course',
          include: [{ model: Coach, as: 'coach', attributes: ['id', 'name'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit: pageSize,
      offset,
    });

    res.json({ error: false, list, total, page, pageSize });
  } catch (err) {
    next(err);
  }
});

// PUT /api/admin/bookings/:id/checkin - confirm attendance + mint FitToken reward
router.put('/:id/checkin', async (req, res, next) => {
  try {
    const booking = await Booking.findByPk(req.params.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'walletAddress'] },
        { model: Course, as: 'course' },
      ],
    });

    if (!booking) {
      return res.status(404).json({
        error: true,
        message: '预约记录不存在',
        code: 'NOT_FOUND',
      });
    }

    if (booking.status !== 'booked') {
      return res.status(400).json({
        error: true,
        message: '只有已预约的记录才能签到',
        code: 'INVALID_STATUS',
      });
    }

    // Update booking status to checked_in
    booking.status = 'checked_in';
    await booking.save();

    // Mint 20 FitToken reward to user via service wallet
    let mintResult = null;
    if (booking.user && booking.user.walletAddress) {
      try {
        mintResult = await blockchainService.mintFitToken(booking.user.walletAddress, 20);
        // Record token transaction
        await blockchainService.recordTokenTransaction({
          fromAddress: '0x0000000000000000000000000000000000000000',
          toAddress: booking.user.walletAddress,
          amount: '20',
          type: 'course_reward',
          txHash: mintResult.txHash,
        });
        console.log(
          `[admin/bookings] Minted 20 FIT to ${booking.user.walletAddress} for booking #${booking.id}`
        );
      } catch (err) {
        console.error('[admin/bookings] FitToken mint failed:', err.message);
        // Do not block the check-in even if minting fails
      }
    }

    res.json({
      error: false,
      data: {
        booking,
        mintResult,
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
