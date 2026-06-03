'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('achievements', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      condition_type: {
        type: Sequelize.STRING(30),
        allowNull: false,
      },
      condition_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      badge_image_cid: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      metadata_cid: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      rarity: {
        type: Sequelize.ENUM('common', 'rare', 'epic', 'legendary'),
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('achievements');
  },
};
