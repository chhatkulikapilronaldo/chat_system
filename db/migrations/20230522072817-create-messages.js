'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('messages', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
	 uuid:{
        type: Sequelize.STRING
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      room_id: {
        type: Sequelize.INTEGER
      },
      message_body: {
        type: Sequelize.STRING
      },
      createdAt: {
       
        type: Sequelize.BIGINT(50)
      },
      updatedAt: {
      
        type: Sequelize.BIGINT(50)
      },
      is_delete:{
        defaultValue: 0,
        type: Sequelize.TINYINT
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('messages');
  }
};