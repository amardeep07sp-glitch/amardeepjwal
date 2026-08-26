// Creates the FIRST Super Admin on a fresh production database - there was
// previously no way to do this outside development (auth.seed.js's
// seedDevUser is gated to NODE_ENV=development and uses a fixed dev-only
// phone/password) or by hand-editing the DB.
//
// Idempotent: if any super_admin already exists, this does nothing and
// exits cleanly - safe to run again by accident, and safe to leave in a
// deploy script.
//
// Usage (all four env vars required):
//   SUPER_ADMIN_NAME="Jane Doe" \
//   SUPER_ADMIN_EMAIL="admin@yourdomain.com" \
//   SUPER_ADMIN_PHONE="9999999999" \
//   SUPER_ADMIN_PASSWORD="a-real-strong-password" \
//   node scripts/seedSuperAdmin.js
import { connectDB, disconnectDB } from '../src/config/db.js';
import { logger } from '../src/config/logger.js';
import { User } from '../src/modules/auth/auth.model.js';
import { ROLES } from '../src/constants/roles.js';

async function run() {
  const { SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PHONE, SUPER_ADMIN_PASSWORD } = process.env;

  if (!SUPER_ADMIN_NAME || !SUPER_ADMIN_EMAIL || !SUPER_ADMIN_PHONE || !SUPER_ADMIN_PASSWORD) {
    logger.error(
      '[seed] Missing one or more required env vars: SUPER_ADMIN_NAME, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PHONE, SUPER_ADMIN_PASSWORD'
    );
    process.exit(1);
  }
  if (SUPER_ADMIN_PASSWORD.length < 8) {
    logger.error('[seed] SUPER_ADMIN_PASSWORD must be at least 8 characters (auth.model.js requires it).');
    process.exit(1);
  }

  await connectDB();

  const existing = await User.findOne({ role: ROLES.SUPER_ADMIN });
  if (existing) {
    logger.info(`[seed] A Super Admin already exists (${existing.email}) - nothing to do.`);
    await disconnectDB();
    process.exit(0);
  }

  const emailTaken = await User.findOne({ email: SUPER_ADMIN_EMAIL.toLowerCase() });
  if (emailTaken) {
    logger.error(`[seed] ${SUPER_ADMIN_EMAIL} is already in use by a non-super-admin account - choose a different email.`);
    await disconnectDB();
    process.exit(1);
  }

  const admin = new User({
    name: SUPER_ADMIN_NAME,
    email: SUPER_ADMIN_EMAIL.toLowerCase(),
    phone: SUPER_ADMIN_PHONE,
    password: SUPER_ADMIN_PASSWORD, // hashed by auth.model.js's own pre-save hook
    role: ROLES.SUPER_ADMIN,
  });
  await admin.save();

  logger.info(`[seed] Super Admin created - email: ${admin.email}, phone: ${admin.phone}. Log in at the admin panel with this email/phone and the password you set.`);
  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  logger.error({ err: err.message }, '[seed] Super Admin seed failed');
  await disconnectDB().catch(() => {});
  process.exit(1);
});
