import streamifier from 'streamifier';
import { cloudinary } from '../../config/cloudinary.js';

// The ONLY place that talks to the Cloudinary SDK directly. Every other file
// in the media module goes through these two functions - never call
// cloudinary.uploader.* anywhere else.

export function uploadBufferToCloudinary(buffer, { folder, publicId, resourceType }) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, resource_type: resourceType, overwrite: false },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

export function buildThumbnailUrl(publicId, resourceType) {
  if (resourceType === 'video') {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      transformation: [{ width: 400, height: 400, crop: 'fill', start_offset: '0' }],
    });
  }
  return cloudinary.url(publicId, {
    resource_type: 'image',
    transformation: [{ width: 300, height: 300, crop: 'thumb', gravity: 'auto' }],
  });
}

// Used only by the Media Health check (Module 6) to detect a DB record whose
// remote asset has disappeared (deleted directly in the Cloudinary dashboard,
// account changes, etc.) - never called on the hot upload/replace/delete path.
export async function checkAssetExists(publicId, resourceType) {
  try {
    await cloudinary.api.resource(publicId, { resource_type: resourceType });
    return true;
  } catch (error) {
    if (error.http_code === 404) return false;
    throw error;
  }
}

export async function destroyCloudinaryAsset(publicId, resourceType) {
  const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  // 'not found' means the remote asset is already gone - that's still a
  // successful outcome for a delete, so our DB record isn't left orphaned
  // forever chasing an asset that no longer exists.
  if (result.result !== 'ok' && result.result !== 'not found') {
    throw new Error(`Cloudinary deletion failed: ${result.result}`);
  }
  return result;
}
