module.exports = (sequelize, DataTypes) => {
  const Achievement = sequelize.define(
    'Achievement',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      conditionType: {
        type: DataTypes.STRING(30),
        allowNull: false,
        comment: 'checkin_total / checkin_streak / course_complete',
      },
      conditionValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'Threshold value',
      },
      badgeImageCid: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      metadataCid: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      rarity: {
        type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
        allowNull: false,
      },
    },
    {
      tableName: 'achievements',
      underscored: true,
    }
  );

  return Achievement;
};
