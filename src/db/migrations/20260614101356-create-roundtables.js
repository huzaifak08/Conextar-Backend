"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "Roundtables",
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
          code: {
            type: Sequelize.STRING(4),
            allowNull: false,
            unique: true,
          },
          createdById: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: "Users",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          status: {
            type: Sequelize.ENUM("active", "inactive"),
            allowNull: false,
            defaultValue: "active",
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
      await queryInterface.dropTable("Roundtables", { transaction });

      // Clean up the ENUM type explicitly in Postgres environments on rollback
      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_Roundtables_status";',
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
