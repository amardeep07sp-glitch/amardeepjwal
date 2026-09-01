// One-time fix: the full-size `cloudinary.secureUrl` on every seed-catalog
// Media doc was uploaded at its source photo's natural (non-square) aspect
// ratio - ProductCard.jsx (and the equivalent category/collection cards)
// render it inside a 1:1 box with object-contain, so a non-square source
// left visible empty bg-secondary padding on two sides instead of filling
// the frame. Inserts a Cloudinary c_fill,ar_1:1 transformation into the
// already-uploaded asset's URL (no re-download/re-upload needed) so it
// becomes a true square without touching anything else.
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Media } from '../src/modules/media/media.model.js';

const TRANSFORM = 'c_fill,g_auto,ar_1:1,w_1200';

async function run() {
  await connectDB();
  const docs = await Media.find({ 'cloudinary.folder': 'seed-catalog' });
  console.log(`Found ${docs.length} seed-catalog media docs`);

  let updated = 0;
  for (const doc of docs) {
    const url = doc.cloudinary.secureUrl;
    if (url.includes(TRANSFORM)) continue; // eslint-disable-line no-continue
    const fixedUrl = url.replace('/upload/', `/upload/${TRANSFORM}/`);
    doc.cloudinary.secureUrl = fixedUrl;
    doc.cloudinary.width = 1200;
    doc.cloudinary.height = 1200;
    // eslint-disable-next-line no-await-in-loop
    await doc.save();
    updated += 1;
  }

  console.log(`Updated ${updated} media docs to a square (1:1) secureUrl`);
  await disconnectDB();
  process.exit(0);
}

run().catch(async (err) => {
  console.error(err);
  await disconnectDB().catch(() => {});
  process.exit(1);
});
