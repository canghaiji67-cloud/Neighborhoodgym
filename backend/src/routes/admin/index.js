const router = require('express').Router();
const { authenticateToken, requireAdmin } = require('../../middleware/auth');

// All admin routes require JWT + admin role
router.use(authenticateToken);
router.use(requireAdmin);

router.use('/stats', require('./stats'));
router.use('/users', require('./users'));
router.use('/coaches', require('./coaches'));
router.use('/courses', require('./courses'));
router.use('/bookings', require('./bookings'));
router.use('/achievements', require('./achievements'));
router.use('/transactions', require('./transactions'));
router.use('/homepage', require('./homepage'));

module.exports = router;
