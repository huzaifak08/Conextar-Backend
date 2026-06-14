const dotenv = require("dotenv");
const path = require("path");

// Safely boot environment keys at runtime point-zero
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

module.exports = {
  development: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    // ✅ Fixes [SEQUELIZE0002] by passing a direct functional console pipe instead of a boolean
    logging: (msg) => console.log(`⚙️ [SEQUELIZE] -> ${msg}`),
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false, // Essential for self-signed AWS certificates
      },
    },
  },
  production: {
    url: process.env.DATABASE_URL,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};
