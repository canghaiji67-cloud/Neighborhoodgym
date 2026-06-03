const path = require('path');
const fs = require('fs');
const dotenvResult = require('dotenv').config({
  path: path.join(__dirname, '..', '.env'),
});

const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const blockchain = require('./config/blockchain');
const db = require('./models');

const app = express();
const PORT = process.env.PORT || 3001;
const envFileContent = fs.existsSync(path.join(__dirname, '..', '.env'))
  ? fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8')
  : '';
const deepSeekKeyConfigured =
  Boolean(process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_AI_KEY) ||
  /^\s*DEEPSEEK_(?:API|AI)_KEY\s*=\s*(.+?)\s*$/m.test(envFileContent);

console.log('[env] dotenv path:', path.join(__dirname, '..', '.env'));
console.log('[env] dotenv loaded:', !dotenvResult.error);
console.log(
  '[env] DeepSeek key configured:',
  deepSeekKeyConfigured
);

// ==================== Middleware ====================

// CORS
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true,
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/public', express.static(path.join(__dirname, '..', 'public')));

// ==================== Routes ====================

// Placeholder route for health check
app.get('/api/health', (req, res) => {
  res.json({ error: false, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

// Public routes (no JWT required)
app.use('/api/auth', require('./routes/auth'));
app.use('/api/homepage', require('./routes/homepage'));

// Member routes (JWT required)
app.use('/api/user', require('./routes/user'));
app.use('/api/courses', require('./routes/course'));
app.use('/api/coaches', require('./routes/coach'));
app.use('/api/checkins', require('./routes/checkin'));
app.use('/api/achievements', require('./routes/achievement'));
app.use('/api/bookings', require('./routes/booking'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/ai', require('./routes/ai'));

// Admin routes (JWT + admin role required)
app.use('/api/admin', require('./routes/admin'));

// ==================== 404 Handler ====================
app.use((req, res) => {
  res.status(404).json({
    error: true,
    message: `接口不存在: ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
  });
});

// ==================== Error Handler ====================
app.use(errorHandler);

// ==================== Start Server ====================
async function start() {
  try {
    // Test database connection
    await db.sequelize.authenticate();
    console.log('[DB] MySQL connection established successfully');

    // Initialize blockchain provider & contracts
    blockchain.init();

    // Start HTTP server
    app.listen(PORT, () => {
      console.log(`[Server] Backend running at http://localhost:${PORT}`);
      console.log(`[Server] Static files served at http://localhost:${PORT}/uploads`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
}

start();

module.exports = app;
