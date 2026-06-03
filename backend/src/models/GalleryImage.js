module.exports = (sequelize, DataTypes) => {
  const GalleryImage = sequelize.define(
    'GalleryImage',
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
      description: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sortOrder: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'gallery_images',
      underscored: true,
    }
  );

  return GalleryImage;
};
