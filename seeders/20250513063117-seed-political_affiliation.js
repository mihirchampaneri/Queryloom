module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('political_affiliation', [
      { affiliation: 'Democrat', createdAt: new Date(), updatedAt: new Date() },
      { affiliation: 'Republican', createdAt: new Date(), updatedAt: new Date() },
      { affiliation: 'Other', createdAt: new Date(), updatedAt: new Date() },
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('political_affiliation', null, {});
  },
};
