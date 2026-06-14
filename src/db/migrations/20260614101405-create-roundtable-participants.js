"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      await queryInterface.createTable(
        "RoundtableParticipants",
        {
          id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.STRING,
          },
          userId: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: "Users",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          roundtableId: {
            type: Sequelize.STRING,
            allowNull: false,
            references: {
              model: "Roundtables",
              key: "id",
            },
            onUpdate: "CASCADE",
            onDelete: "CASCADE",
          },
          status: {
            type: Sequelize.ENUM("joined", "left"),
            allowNull: false,
            defaultValue: "joined",
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
      await queryInterface.dropTable("RoundtableParticipants", { transaction });

      await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_RoundtableParticipants_status";',
        { transaction },
      );

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },
};
