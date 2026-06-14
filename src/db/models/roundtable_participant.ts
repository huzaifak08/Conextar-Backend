import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

export class RoundtableParticipant extends Model<
  InferAttributes<RoundtableParticipant>,
  InferCreationAttributes<RoundtableParticipant>
> {
  declare id: string;
  declare userId: string;
  declare roundtableId: string;
  declare status: "joined" | "left";

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  static associate(models: any) {
    RoundtableParticipant.belongsTo(models.User, {
      foreignKey: "userId",
      as: "user",
    });

    RoundtableParticipant.belongsTo(models.Roundtable, {
      foreignKey: "roundtableId",
      as: "roundtable",
    });
  }
}

export default function initRoundtableParticipant(sequelize: Sequelize) {
  console.log(
    "Initializing RoundtableParticipant model configuration entrypoint...",
  );
  RoundtableParticipant.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "Users",
          key: "id",
        },
      },
      roundtableId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
          model: "Roundtables",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("joined", "left"),
        allowNull: false,
        defaultValue: "joined",
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
      modelName: "RoundtableParticipant",
      tableName: "RoundtableParticipants",
      timestamps: true,
      paranoid: true,
    },
  );

  return RoundtableParticipant;
}
