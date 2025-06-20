'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Groups', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      groupName: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      groupInfo: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      groupCategory: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      groupProfilePic: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      groupBackgroundImg: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      whoCanPost: {
        type: Sequelize.ENUM('admin', 'anyone'),
        defaultValue: 'anyone',
        allowNull: false,
      },
      visibility: {
        type: Sequelize.ENUM('private', 'public'),
        defaultValue: 'public',
        allowNull: false,
      },
      approvalRequired: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      allowIncognitoPost: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Groups');
  },
};
