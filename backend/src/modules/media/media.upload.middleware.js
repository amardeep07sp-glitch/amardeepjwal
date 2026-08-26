import multer from 'multer';
import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import { ALLOWED_IMAGE_MIME_TYPES, ALLOWED_VIDEO_MIME_TYPES, ALLOWED_DOCUMENT_MIME_TYPES } from './media.constants.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // ALLOWED_DOCUMENT_MIME_TYPES already includes the image list (a document
  // can be a photo of a paper) - the spread naturally dedupes via Set-like
  // .includes() below, no harm in the overlap.
  const allowed = [...ALLOWED_IMAGE_MIME_TYPES, ...ALLOWED_VIDEO_MIME_TYPES, ...ALLOWED_DOCUMENT_MIME_TYPES];
  if (!allowed.includes(file.mimetype)) {
    cb(new Error(`Unsupported file type: ${file.mimetype}`));
    return;
  }
  cb(null, true);
};

// Hard ceiling at the Multer layer only - never written to disk, kept
// entirely in memory as a Buffer. The type-specific limit (images vs
// videos, per MEDIA_MAX_IMAGE_SIZE_MB / MEDIA_MAX_VIDEO_SIZE_MB) is enforced
// in media.service.js once the resolved media type is known.
const maxPossibleBytes = Math.max(env.MEDIA_MAX_IMAGE_SIZE_MB, env.MEDIA_MAX_VIDEO_SIZE_MB) * 1024 * 1024;

const mediaUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxPossibleBytes },
}).single('file');

export const handleMediaUpload = (req, res, next) => {
  mediaUpload(req, res, (err) => {
    if (err) return next(new ApiError(400, err.message || 'File upload failed'));
    if (!req.file) return next(new ApiError(400, 'No file was uploaded'));
    next();
  });
};

// Support tickets/issue reports let a customer attach several pieces of
// evidence (damaged-item photos, screenshots) in one submit - same
// storage/fileFilter/size ceiling as the single-file path above, just
// `.array()` instead of `.single()`. Files are optional here (a ticket/
// issue with zero attachments is valid), so this never 400s on an empty
// upload the way handleMediaUpload does.
const attachmentsUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: maxPossibleBytes },
}).array('attachments', 5);

export const handleAttachmentsUpload = (req, res, next) => {
  attachmentsUpload(req, res, (err) => {
    if (err) return next(new ApiError(400, err.message || 'File upload failed'));
    next();
  });
};
