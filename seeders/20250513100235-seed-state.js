'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('states', [
      { id: 1, name: 'Kabul', countryId: 1 },
      { id: 2, name: 'Herat', countryId: 1 },
      { id: 3, name: 'Tirana', countryId: 3 },
      { id: 4, name: 'Andaman and Nicobar Islands', countryId: 101 },
      { id: 5, name: 'Andhra Pradesh', countryId: 101 },
      { id: 6, name: 'Arunachal Pradesh', countryId: 101 },
      { id: 7, name: 'Assam', countryId: 101 },
      { id: 8, name: 'Bihar', countryId: 101 },
      { id: 9, name: 'Chandigarh', countryId: 101 },
      { id: 10, name: 'Chhattisgarh', countryId: 101 },
      { id: 11, name: 'Dadra and Nagar Haveli and Daman and Diu', countryId: 101 },
      { id: 12, name: 'Delhi', countryId: 101 },
      { id: 13, name: 'Goa', countryId: 101 },
      { id: 14, name: 'Gujarat', countryId: 101 },
      { id: 15, name: 'Haryana', countryId: 101 },
      { id: 16, name: 'Himachal Pradesh', countryId: 101 },
      { id: 17, name: 'Jammu and Kashmir', countryId: 101 },
      { id: 18, name: 'Jharkhand', countryId: 101 },
      { id: 19, name: 'Karnataka', countryId: 101 },
      { id: 20, name: 'Kerala', countryId: 101 },
      { id: 21, name: 'Ladakh', countryId: 101 },
      { id: 22, name: 'Lakshadweep', countryId: 101 },
      { id: 23, name: 'Madhya Pradesh', countryId: 101 },
      { id: 24, name: 'Maharashtra', countryId: 101 },
      { id: 25, name: 'Manipur', countryId: 101 },
      { id: 26, name: 'Meghalaya', countryId: 101 },
      { id: 27, name: 'Mizoram', countryId: 101 },
      { id: 28, name: 'Nagaland', countryId: 101 },
      { id: 29, name: 'Odisha', countryId: 101 },
      { id: 30, name: 'Puducherry', countryId: 101 },
      { id: 31, name: 'Punjab', countryId: 101 },
      { id: 32, name: 'Rajasthan', countryId: 101 },
      { id: 33, name: 'Sikkim', countryId: 101 },
      { id: 34, name: 'Tamil Nadu', countryId: 101 },
      { id: 35, name: 'Telangana', countryId: 101 },
      { id: 36, name: 'Tripura', countryId: 101 },
      { id: 37, name: 'Uttar Pradesh', countryId: 101 },
      { id: 38, name: 'Uttarakhand', countryId: 101 },
      { id: 39, name: 'West Bengal', countryId: 101 }
    ]);
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('states', null, {});
  }
};
