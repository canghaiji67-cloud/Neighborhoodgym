module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      walletAddress: {
        type: DataTypes.STRING(42),
        allowNull: false,
        unique: true,
      },
      nickname: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      avatar: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM('member', 'admin'),
        defaultValue: 'member',
      },
      memberLevel: {
        type: DataTypes.ENUM('normal', 'silver', 'gold', 'diamond'),
        defaultValue: 'normal',
      },
      nonce: {
        type: DataTypes.STRING(64),
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      underscored: true,
    }
  );

  return User;
};
