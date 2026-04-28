const app = require('./app');
const env = require('./config/env');
const logger = require('./config/logger');

const server = app.listen(env.port, () => {
  logger.info(`ERP-Pharm backend listening on port ${env.port} (${env.nodeEnv})`);
});

process.on('unhandledRejection', (err) => {
  logger.error('Unhandled rejection', { err });
  server.close(() => process.exit(1));
});
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down');
  server.close(() => process.exit(0));
});
