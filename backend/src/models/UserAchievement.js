module.exports = (sequelize, DataTypes) => {
  const UserAchievement = sequelize.define(
    'UserAchievement',
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
      achievementId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nftTokenId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: 'On-chain NFT token ID',
      },
      mintTxHash: {
        type: DataTypes.STRING(66),
        allowNull: true,
      },
    },
    {
      tableName: 'user_achievements',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'achievement_id'],
        },
      ],
    }
  );

  return UserAchievement;
};
