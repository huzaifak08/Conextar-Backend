import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class Roundtable extends Model<
  InferAttributes<Roundtable>,
  InferCreationAttributes<Roundtable>
> {
  declare id: string;
  declare name: string;
  declare code: string;
  declare createdById: string;
  declare status: "active" | "inactive";

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  static associate(models: any) {
    Roundtable.belongsTo(models.User, {
      foreignKey: "createdById",
      as: "creator",
    });

    Roundtable.hasMany(models.RoundtableParticipant, {
      foreignKey: "roundtableId",
      as: "participants",
    });
  }
}

export default function initRoundtable(sequelize: Sequelize) {
  console.log("Initializing Roundtable model configuration entrypoint...");
  Roundtable.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(4),
        allowNull: false,
        unique: true,
        validate: {
          len: [4, 4],
        },
      },
      createdById: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("active", "inactive"),
        allowNull: false,
        defaultValue: "active",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
    },
    {
      sequelize,
      modelName: "Roundtable",
      tableName: "Roundtables",
      timestamps: true,
      paranoid: true,
    },
  );

  return Roundtable;
}
