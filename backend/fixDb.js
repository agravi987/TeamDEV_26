require('dotenv').config();
const { sequelize } = require('./src/models');

async function fix() {
  try {
    const [results] = await sequelize.query('SHOW INDEXES FROM users');
    const emailIndexes = results.filter(r => r.Column_name === 'email' && r.Key_name !== 'PRIMARY');
    let dropped = 0;
    
    // Drop all except the first one
    for (let i = 1; i < emailIndexes.length; i++) {
        const indexName = emailIndexes[i].Key_name;
        await sequelize.query(`ALTER TABLE users DROP INDEX \`${indexName}\``);
        dropped++;
    }
    console.log(`Dropped ${dropped} extra indexes on email column in the users table.`);
  } catch (err) {
    console.error('Failed to drop indexes:', err);
  } finally {
    process.exit(0);
  }
}

fix();
