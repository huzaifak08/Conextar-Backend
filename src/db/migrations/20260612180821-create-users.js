"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "Users",
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING,
          },
          name: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          profilePic: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
          },
          email: {
            type: Sequelize.STRING,
            allowNull: false,
            unique: true,
          },
          password: {
            type: Sequelize.STRING,
            allowNull: false,
          },
          deviceToken: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
          },
          isVerified: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false,
          },
          otpCode: {
            type: Sequelize.STRING(6),
            allowNull: true,
            defaultValue: null,
          },
          otpExpiresAt: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
          },
          refreshToken: {
            type: Sequelize.TEXT,
            allowNull: true,
            defaultValue: null,
          },
          createdAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          updatedAt: {
            allowNull: false,
            type: Sequelize.DATE,
          },
          deletedAt: {
            type: Sequelize.DATE,
            allowNull: true,
            defaultValue: null,
          },
        },
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.dropTable("Users", { transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
