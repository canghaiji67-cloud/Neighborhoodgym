module.exports = (sequelize, DataTypes) => {
  const CourseReview = sequelize.define(
    'CourseReview',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      courseId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      coachId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      rating: {
        type: DataTypes.TINYINT,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'course_reviews',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'course_id'],
        },
      ],
    }
  );

  return CourseReview;
};
