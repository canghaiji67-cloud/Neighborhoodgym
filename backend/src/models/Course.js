module.exports = (sequelize, DataTypes) => {
  const Course = sequelize.define(
    'Course',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'App-level enum: 瑜伽/动感单车/普拉提/游泳/器械训练/其他',
      },
      coachId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      startTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      endTime: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      location: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      maxCapacity: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      enrolledCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Redundant counter maintained by transactions',
      },
      fitTokenCost: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Human-readable unit, 0 = free',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      difficulty: {
        type: DataTypes.ENUM('beginner', 'intermediate', 'advanced'),
        allowNull: true,
      },
      suitableFor: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
    },
    {
      tableName: 'courses',
      underscored: true,
    }
  );

  return Course;
};
