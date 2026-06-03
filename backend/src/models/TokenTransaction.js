module.exports = (sequelize, DataTypes) => {
  const TokenTransaction = sequelize.define(
    'TokenTransaction',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      fromAddress: {
        type: DataTypes.STRING(42),
        allowNull: true,
      },
      toAddress: {
        type: DataTypes.STRING(42),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(36, 18),
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM(
          'checkin_reward',
          'milestone_reward',
          'course_reward',
          'course_payment'
        ),
        allowNull: false,
      },
      txHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'token_transactions',
      underscored: true,
    }
  );

  return TokenTransaction;
};
