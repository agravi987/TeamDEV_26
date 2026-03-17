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

async function test() {
  try {
    await sequelize.authenticate();
    console.log('Connected to MySQL server successfully.');
    const [results, metadata] = await sequelize.query("SHOW DATABASES;");
    console.log('Databases:', results.map(r => r.Database));
  } catch(e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
test();
