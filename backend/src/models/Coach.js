module.exports = (sequelize, DataTypes) => {
  const Coach = sequelize.define(
    'Coach',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
        unique: true,
      },
      specialties: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Comma separated, e.g. "瑜伽,普拉提"',
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('active', 'inactive'),
        defaultValue: 'active',
      },
      isRecommended: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'coaches',
      underscored: true,
    }
  );

  return Coach;
};
