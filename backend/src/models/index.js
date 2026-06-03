const { Sequelize, DataTypes } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: dbConfig.logging,
    define: dbConfig.define,
  }
);

// Load models
const User = require('./User')(sequelize, DataTypes);
const Membership = require('./Membership')(sequelize, DataTypes);
const Coach = require('./Coach')(sequelize, DataTypes);
const CoachFavorite = require('./CoachFavorite')(sequelize, DataTypes);
const Course = require('./Course')(sequelize, DataTypes);
const Booking = require('./Booking')(sequelize, DataTypes);
const CourseReview = require('./CourseReview')(sequelize, DataTypes);
const CheckIn = require('./CheckIn')(sequelize, DataTypes);
const Achievement = require('./Achievement')(sequelize, DataTypes);
const UserAchievement = require('./UserAchievement')(sequelize, DataTypes);
const TokenTransaction = require('./TokenTransaction')(sequelize, DataTypes);
const GymInfo = require('./GymInfo')(sequelize, DataTypes);
const Carousel = require('./Carousel')(sequelize, DataTypes);
const Announcement = require('./Announcement')(sequelize, DataTypes);
const GalleryImage = require('./GalleryImage')(sequelize, DataTypes);
const ChatSession = require('./ChatSession')(sequelize, DataTypes);
const ChatMessage = require('./ChatMessage')(sequelize, DataTypes);

// ==================== Associations ====================

// User hasMany
User.hasMany(Membership, { foreignKey: 'user_id', as: 'memberships' });
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
User.hasMany(CheckIn, { foreignKey: 'user_id', as: 'checkins' });
User.hasMany(UserAchievement, { foreignKey: 'user_id', as: 'userAchievements' });
User.hasMany(CoachFavorite, { foreignKey: 'user_id', as: 'coachFavorites' });
User.hasMany(CourseReview, { foreignKey: 'user_id', as: 'courseReviews' });

// Membership belongsTo User
Membership.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Coach hasMany
Coach.hasMany(Course, { foreignKey: 'coach_id', as: 'courses' });
Coach.hasMany(CoachFavorite, { foreignKey: 'coach_id', as: 'coachFavorites' });
Coach.hasMany(CourseReview, { foreignKey: 'coach_id', as: 'courseReviews' });

// Course belongsTo Coach; hasMany Booking, CourseReview
Course.belongsTo(Coach, { foreignKey: 'coach_id', as: 'coach' });
Course.hasMany(Booking, { foreignKey: 'course_id', as: 'bookings' });
Course.hasMany(CourseReview, { foreignKey: 'course_id', as: 'courseReviews' });

// Booking belongsTo User, Course
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Booking.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });

// CourseReview belongsTo User, Course, Coach
CourseReview.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CourseReview.belongsTo(Course, { foreignKey: 'course_id', as: 'course' });
CourseReview.belongsTo(Coach, { foreignKey: 'coach_id', as: 'coach' });

// CoachFavorite belongsTo User, Coach
CoachFavorite.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
CoachFavorite.belongsTo(Coach, { foreignKey: 'coach_id', as: 'coach' });

// CheckIn belongsTo User
CheckIn.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Achievement hasMany UserAchievement
Achievement.hasMany(UserAchievement, { foreignKey: 'achievement_id', as: 'userAchievements' });

// UserAchievement belongsTo User, Achievement
UserAchievement.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievement_id', as: 'achievement' });

// ChatSession belongsTo User; hasMany ChatMessage
User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'chatSessions' });
ChatSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id', as: 'messages' });
ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id', as: 'session' });

const db = {
  sequelize,
  Sequelize,
  User,
  Membership,
  Coach,
  CoachFavorite,
  Course,
  Booking,
  CourseReview,
  CheckIn,
  Achievement,
  UserAchievement,
  TokenTransaction,
  GymInfo,
  Carousel,
  Announcement,
  GalleryImage,
  ChatSession,
  ChatMessage,
};

module.exports = db;
