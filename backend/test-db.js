const sequelize = require('./src/config/db');
async function test() {
  try {
    await sequelize.authenticate();
    console.log('Success');
  } catch(e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}
test();
