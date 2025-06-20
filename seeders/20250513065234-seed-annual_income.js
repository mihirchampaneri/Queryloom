// seeders/YYYYMMDDHHMMSS-seed-annual-income.js

'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const incomeRanges = [
      { name: 'Getting by with Support', range: '$0–$24,999' },
      { name: 'Meeting Essentials', range: '$25,000–$59,999' },
      { name: 'Financially Stable', range: '$59,999–$99,999' },
      { name: 'Comfortably Established', range: '$100,000–$169,999' },
      { name: 'Financially Thriving', range: '$170,000–$250,000' },
      { name: 'Prosperous and Expanding', range: '>$250,000' },
      { name: 'Ultra Wealthy', range: 'N/A' },
    ];

    const incomeData = incomeRanges.map(({ name, range }) => ({
      name,
      range
    }));

    await queryInterface.bulkInsert('AnnualIncomes', incomeData, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('AnnualIncomes', null, {});
  }
};
