module.exports = (sequelize, DataTypes) => {
  const Membership = sequelize.define(
    'Membership',
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
      planType: {
        type: DataTypes.TINYINT,
        allowNull: false,
        comment: '1=monthly, 2=quarterly, 3=yearly',
      },
      purchasedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      amount: {
        type: DataTypes.DECIMAL(18, 8),
        allowNull: false,
        comment: 'ETH amount',
      },
      txHash: {
        type: DataTypes.STRING(66),
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'memberships',
      underscored: true,
    }
  );

  return Membership;
};
