'use strict';

const sequelize = require("../config/database");

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AnnualIncomes', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      name:{
        type:Sequelize.STRING,
        allowNull:false
      },
      range: {
        type: Sequelize.STRING,
        allowNull: false,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AnnualIncomes');
  }
};
