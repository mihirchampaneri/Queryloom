'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserFollows', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      followerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users', // change 'Users' if your table name is different
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      followingId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      blocked: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Add unique constraint to avoid duplicate follower-following pairs
    await queryInterface.addConstraint('UserFollows', {
      fields: ['followerId', 'followingId'],
      type: 'unique',
      name: 'unique_follower_following_pair'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('UserFollows');
  }
};
