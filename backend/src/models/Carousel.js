module.exports = (sequelize, DataTypes) => {
  const Carousel = sequelize.define(
    'Carousel',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      imageUrl: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      linkUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'Higher value = higher priority',
      },
      isEnabled: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'carousels',
      underscored: true,
    }
  );

  return Carousel;
};
