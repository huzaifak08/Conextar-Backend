import {
  CreationOptional,
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";

interface UserAttributes {
  id: string;
  name: string;
  profilePic: string | null;
  email: string;
  password: string;
  deviceToken: string | null;
  isVerified: boolean;
  otpCode: string | null;
  otpExpiresAt: Date | null;
  refreshToken: string | null;

  createdAt: CreationOptional<Date>;
  updatedAt: CreationOptional<Date>;
  deletedAt: CreationOptional<Date | null>;
}

export class User
  extends Model<InferAttributes<User>, InferCreationAttributes<User>>
  implements UserAttributes
{
  declare id: string;
  declare name: string;
  declare profilePic: string | null;
  declare email: string;
  declare password: string;
  declare deviceToken: string | null;
  declare isVerified: boolean;
  declare otpCode: string | null;
  declare otpExpiresAt: Date | null;
  declare refreshToken: string | null;

  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare deletedAt: CreationOptional<Date | null>;

  static associate(models: any) {
    // Define associations here when tables grow (e.g., User.hasMany)
  }
}

export default function initUser(sequelize: Sequelize) {
  console.log("Initializing User model configuration entrypoint...");
  User.init(
    {
      id: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      profilePic: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      deviceToken: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: null,
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      otpCode: {
        type: DataTypes.STRING(6),
        allowNull: true,
        defaultValue: null,
      },
      otpExpiresAt: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: null,
      },
      refreshToken: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
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
      modelName: "User",
      tableName: "Users",
      timestamps: true,
      paranoid: true, // Enables soft deletes matching your deletedAt parameter requirements
    },
  );

  return User;
}
