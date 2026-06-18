const { Sequelize } = require('sequelize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || './database/dev.sqlite';
let sequelize;

if (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://')) {
  sequelize = new Sequelize(dbUrl, {
    dialect: 'postgres',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true
    }
  });
} else {
  // SQLite
  const absolutePath = path.resolve(dbUrl);
  const dir = path.dirname(absolutePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: absolutePath,
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      underscored: true
    }
  });
}

module.exports = sequelize;
