'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      wallet_address: {
        type: Sequelize.STRING(42),
        allowNull: false,
        unique: true,
      },
      nickname: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      avatar: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      phone: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('member', 'admin'),
        defaultValue: 'member',
        allowNull: false,
      },
      member_level: {
        type: Sequelize.ENUM('normal', 'silver', 'gold', 'diamond'),
        defaultValue: 'normal',
        allowNull: false,
      },
      nonce: {
        type: Sequelize.STRING(64),
        allowNull: true,
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
    await queryInterface.dropTable('users');
  },
};
