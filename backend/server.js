require('dotenv').config();
const app = require('./src/app');
const { sequelize } = require('./src/models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅  Database connection established successfully.');

    // Sync models (use { force: false } in production, { alter: false } in dev to prevent repetitive index creation)
    const syncOptions =
      process.env.NODE_ENV === 'development' ? { alter: false } : { force: false };

    await sequelize.sync(syncOptions);
    console.log('✅  Database models synchronized.');

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀  Server running on http://0.0.0.0:${PORT}`);
      console.log(`📋  API docs: http://0.0.0.0:${PORT}/api/v1`);
      console.log(`❤️   Health check: http://0.0.0.0:${PORT}/health`);
    });
  } catch (err) {
    console.error('❌  Failed to start server:', err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received. Closing DB connection and shutting down...');
  await sequelize.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received. Closing DB connection and shutting down...');
  await sequelize.close();
  process.exit(0);
});

startServer();
