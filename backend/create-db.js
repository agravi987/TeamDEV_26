const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  '',
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
  }
);

async function createDb() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL server successfully.');
    await sequelize.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`;`);
    console.log(`Database '${process.env.DB_NAME}' created or already exists.`);
  } catch(e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
createDb();
