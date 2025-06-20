'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('Publish', [
      { publishAt: 'Public', createdAt: new Date(), updatedAt: new Date() },
      { publishAt: 'followers', createdAt: new Date(), updatedAt: new Date() },
      { publishAt: 'inner circle', createdAt: new Date(), updatedAt: new Date() },
      { publishAt: 'Group', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Publish', null, {});
  }
};
