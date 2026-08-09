import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectDB, disconnectDB } from './config/db.js';
import { redisClient } from './config/redis.js';
import { seedDevUser } from './modules/auth/auth.seed.js';
import { warehouseService } from './modules/inventory/warehouse.service.js';
import { customerSegmentService } from './modules/customer/customerSegment.service.js';
import { accountSeed } from './modules/accounting/account.seed.js';
import { startCipJobs } from './modules/cip/cip.jobs.js';
import { startCollectionJobs } from './modules/collection/collection.jobs.js';

let server;

const start = async () => {
  await connectDB();
  // Redis connects itself in the background (see config/redis.js); boot must not block on it.

  if (env.NODE_ENV === 'development') {
    await seedDevUser();
  }

  // Idempotent - Inventory provisioning always needs somewhere to put
  // opening stock, even before an admin has configured warehouses.
  await warehouseService.ensureDefaultWarehouse();

  // Idempotent - seeds the named system segments (Retail/Wholesale/VIP/etc.)
  // once, on every boot, same bootstrap discipline as the default warehouse.
  await customerSegmentService.ensureSystemSegments();

  // Idempotent - seeds the fixed Chart of Accounts every accounting-event
  // hook (Sales/Purchase/Wallet/Expense) looks up by code, same bootstrap
  // discipline as the two calls above.
  await accountSeed.ensureSystemAccounts();

  // Customer Intelligence Platform's background sweeps (stale sessions,
  // daily segmentation) - see cip.jobs.js.
  startCipJobs();

  // Collection Engine v2.0's scheduling sweep (auto-publish/auto-archive) -
  // see collection.jobs.js.
  startCollectionJobs();

  server = app.listen(env.PORT, () => {
    logger.info(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
  });
};

const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server?.close(async () => {
    await disconnectDB();
    redisClient.disconnect();
    logger.info('Shutdown complete');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled Rejection');
  process.exit(1);
});

start();
