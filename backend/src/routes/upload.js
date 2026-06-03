const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { uploadGeneric, handleMulterError } = require('../middleware/upload');

router.use(authenticateToken);

// POST /api/upload/image - generic image upload
router.post('/image', uploadGeneric.single('file'), handleMulterError, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: true,
        message: '请选择要上传的图片',
        code: 'NO_FILE',
      });
    }

    // Determine subdirectory from query or default
    const subDir = req.query.type || 'avatars';
    const url = `uploads/${subDir}/${req.file.filename}`;

    res.json({ error: false, data: { url } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
