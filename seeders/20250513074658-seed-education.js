// seeders/YYYYMMDDHHMMSS-seed-educations.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const educationLevels = [
      { name: 'High School or lower' },
      { name: 'Associate Degree' },
      { name: "Bachelor's Degree" },
      { name: "Master's Degree" },
      { name: 'Doctorate or higher' },
    ];

    await queryInterface.bulkInsert('Educations', educationLevels, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Educations', null, {});
  }
};
