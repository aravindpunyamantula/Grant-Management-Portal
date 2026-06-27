const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/grant_portal', {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  dialectOptions: process.env.NODE_ENV === 'production' ? {
    ssl: { require: true, rejectUnauthorized: false },
  } : {},
});

module.exports = sequelize;
