import { Sequelize } from "sequelize";
import initUser, { User } from "./user";
import initRoundtable, { Roundtable } from "./roundtable";
import initRoundtableParticipant, {
  RoundtableParticipant,
} from "./roundtable_participant";

const env = process.env.NODE_ENV || "development";
const config = require("../../config/config.js")[env];

let sequelize: Sequelize;

if (config.url) {
  sequelize = new Sequelize(config.url, config);
} else {
  sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    config,
  );
}

initUser(sequelize);
initRoundtable(sequelize);
initRoundtableParticipant(sequelize);

const db = {
  User,
  Roundtable,
  RoundtableParticipant,
  sequelize,
  Sequelize,
};

Object.keys(db).forEach((modelName) => {
  const model = (db as any)[modelName];
  if (model.associate) {
    console.log(`🔗 Linking associations for database model: ${modelName}`);
    model.associate(db);
  }
});

export { sequelize, Sequelize, User, Roundtable, RoundtableParticipant };
export default db;
