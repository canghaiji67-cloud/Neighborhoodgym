module.exports = (sequelize, DataTypes) => {
  const CheckIn = sequelize.define(
    'CheckIn',
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
      checkInDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      exerciseType: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'e.g. 跑步/器械/游泳',
      },
      durationMinutes: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'Exercise duration in minutes',
      },
      txHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'checkins',
      underscored: true,
    }
  );

  return CheckIn;
};
