module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('political_affiliation', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      affiliation: {
        type: Sequelize.ENUM('Democrat', 'Republican', 'Other'),
        allowNull: false,
        defaultValue: 'Other',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('political_affiliation');
  },
};
