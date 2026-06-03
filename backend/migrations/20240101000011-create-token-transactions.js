'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('token_transactions', {
      id: {
        type: Sequelize.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      from_address: {
        type: Sequelize.STRING(42),
        allowNull: true,
      },
      to_address: {
        type: Sequelize.STRING(42),
        allowNull: true,
      },
      amount: {
        type: Sequelize.DECIMAL(36, 18),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM(
          'checkin_reward',
          'milestone_reward',
          'course_reward',
          'course_payment'
        ),
        allowNull: false,
      },
      tx_hash: {
        type: Sequelize.STRING(66),
        allowNull: false,
        unique: true,
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
    await queryInterface.dropTable('token_transactions');
  },
};
