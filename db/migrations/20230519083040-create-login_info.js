'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('login_info', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_name: {
        type: Sequelize.STRING
      },
      user_password: {
        type: Sequelize.TEXT
      },
      isAdmin: {
        defaultValue: false,
        type: Sequelize.TINYINT
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('login_info');
  }
};