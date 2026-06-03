module.exports = (sequelize, DataTypes) => {
  const CoachFavorite = sequelize.define(
    'CoachFavorite',
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
      coachId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'coach_favorites',
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ['user_id', 'coach_id'],
        },
      ],
    }
  );

  return CoachFavorite;
};
