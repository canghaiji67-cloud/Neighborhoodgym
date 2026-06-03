const jwt = require('jsonwebtoken');

// JWT authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      error: true,
      message: '未登录，请先连接钱包登录',
      code: 'UNAUTHORIZED',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, walletAddress }
    next();
  } catch (err) {
    return res.status(401).json({
      error: true,
      message: '登录已过期，请重新登录',
      code: 'TOKEN_EXPIRED',
    });
  }
}

// Role authorization middleware factory
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: true,
        message: '未登录',
        code: 'UNAUTHORIZED',
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: true,
        message: '无权限访问该资源',
        code: 'FORBIDDEN',
      });
    }

    next();
  };
}

// Convenience: require admin role
const requireAdmin = requireRole('admin');

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
};
