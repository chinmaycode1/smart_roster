import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { prisma } from './lib/prisma.js';

const app = createApp();
const port = parseInt(env.PORT, 10);

async function start() {
  try {
    await prisma.$connect();
    logger.info('Database connected');

    app.listen(port, '0.0.0.0', () => {
      logger.info(`Server running on port ${port}`);
    });
  } catch (error) {
    logger.error(error, 'Failed to start server');
    process.exit(1);
  }
}

async function shutdown() {
  logger.info('Shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => {
  shutdown().catch((err) => {
    logger.error(err, 'Error during shutdown');
    process.exit(1);
  });
});

process.on('SIGINT', () => {
  shutdown().catch((err) => {
    logger.error(err, 'Error during shutdown');
    process.exit(1);
  });
});

void start();
