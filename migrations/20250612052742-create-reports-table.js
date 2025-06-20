'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('Reports', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      groupPostId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'GroupPosts',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      pollId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Polls',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addConstraint('Reports', {
      fields: ['userId', 'pollId'],
      type: 'unique',
      name: 'unique_user_poll_report'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('Reports');
  }
};
