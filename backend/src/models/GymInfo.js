module.exports = (sequelize, DataTypes) => {
  const GymInfo = sequelize.define(
    'GymInfo',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      slogan: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      businessHours: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'e.g. 08:00-22:00',
      },
    },
    {
      tableName: 'gym_info',
      underscored: true,
    }
  );

  return GymInfo;
};
