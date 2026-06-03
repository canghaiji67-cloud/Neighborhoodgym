// Unified error handling middleware
function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.stack || err.message || err);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map((e) => e.message).join('; ');
    return res.status(400).json({
      error: true,
      message: messages,
      code: 'VALIDATION_ERROR',
    });
  }

  // Sequelize unique constraint violation
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors && err.errors[0] ? err.errors[0].path : 'unknown';
    return res.status(409).json({
      error: true,
      message: `数据冲突: ${field} 已存在`,
      code: 'DUPLICATE_ENTRY',
    });
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    return res.status(400).json({
      error: true,
      message: '关联数据不存在或无法删除',
      code: 'FK_CONSTRAINT_ERROR',
    });
  }

  // JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      error: true,
      message: '请求体 JSON 格式错误',
      code: 'INVALID_JSON',
    });
  }

  // Custom application errors with status code
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
      code: err.code || 'APP_ERROR',
    });
  }

  // Default: Internal server error
  return res.status(500).json({
    error: true,
    message: '服务器内部错误',
    code: 'INTERNAL_SERVER_ERROR',
  });
}

module.exports = errorHandler;
