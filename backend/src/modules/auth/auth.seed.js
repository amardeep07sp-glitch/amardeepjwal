import { User } from './auth.model.js';
import { userRepository } from './auth.repository.js';
import { ROLES } from '../../constants/roles.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

export const seedDevUser = async () => {
  const alreadyExists = await userRepository.findByPhone(env.DEV_SEED_PHONE);
  if (alreadyExists) return;

  const devUser = new User({
    name: 'Dev Admin',
    email: `dev.${env.DEV_SEED_PHONE}@local.test`,
    phone: env.DEV_SEED_PHONE,
    password: env.DEV_SEED_PASSWORD,
    role: ROLES.SUPER_ADMIN,
  });

  // Skips schema validation (e.g. password minlength) since this is a fixed,
  // developer-only convenience account that never runs outside development.
  await devUser.save({ validateBeforeSave: false });

  logger.info(`Dev login seeded - phone: ${env.DEV_SEED_PHONE}, password: ${env.DEV_SEED_PASSWORD}`);
};
