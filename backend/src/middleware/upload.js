const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Allowed image MIME types
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

// Max file size: 5MB
const MAX_SIZE = 5 * 1024 * 1024;

// Upload subdirectory mapping
const UPLOAD_DIRS = {
  avatars: 'uploads/avatars',
  coaches: 'uploads/coaches',
  carousels: 'uploads/carousels',
  gallery: 'uploads/gallery',
};

// Ensure directory exists
function ensureDir(dirPath) {
  const fullPath = path.join(__dirname, '..', '..', dirPath);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
  return fullPath;
}

// Create multer storage for a specific subdirectory
function createStorage(subDir) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = UPLOAD_DIRS[subDir] || 'uploads';
      const fullPath = ensureDir(dir);
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, uniqueSuffix + ext);
    },
  });
}

// File filter for images
function imageFileFilter(req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('仅支持 jpg/jpeg/png/webp 格式的图片'), false);
  }
}

// Create multer upload instance for a specific type
function createUpload(subDir) {
  return multer({
    storage: createStorage(subDir),
    fileFilter: imageFileFilter,
    limits: { fileSize: MAX_SIZE },
  });
}

// Pre-built upload instances for each category
const uploadAvatar = createUpload('avatars');
const uploadCoach = createUpload('coaches');
const uploadCarousel = createUpload('carousels');
const uploadGallery = createUpload('gallery');

// Generic upload (default to avatars)
const uploadGeneric = createUpload('avatars');

// Multer error handler middleware
function handleMulterError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: true,
        message: '文件大小超过 5MB 限制',
        code: 'FILE_TOO_LARGE',
      });
    }
    return res.status(400).json({
      error: true,
      message: '文件上传错误: ' + err.message,
      code: 'UPLOAD_ERROR',
    });
  }
  if (err && err.message) {
    return res.status(400).json({
      error: true,
      message: err.message,
      code: 'UPLOAD_ERROR',
    });
  }
  next(err);
}

module.exports = {
  uploadAvatar,
  uploadCoach,
  uploadCarousel,
  uploadGallery,
  uploadGeneric,
  handleMulterError,
  UPLOAD_DIRS,
};
