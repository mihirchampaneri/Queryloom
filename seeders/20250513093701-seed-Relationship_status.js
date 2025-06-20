'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('RelationshipStatuses', [
      { name: 'Married' },
      { name: 'Single' },
      { name: 'In a relationship' },
      { name: 'Divorced' },
      { name: 'Other' }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('RelationshipStatuses', null, {});
  }
};
