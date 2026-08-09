import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { handleMediaUpload } from './media.upload.middleware.js';
import {
  uploadMediaSchema,
  listMediaQuerySchema,
  mediaLibraryQuerySchema,
  mediaIdSchema,
  updateMediaMetadataSchema,
  reorderMediaSchema,
  bulkMediaIdsSchema,
  bulkDeleteMediaSchema,
  deleteMediaSchema,
} from './media.validation.js';
import {
  listMedia,
  browseMediaLibrary,
  getMediaById,
  getMediaDetails,
  getMediaUsage,
  getMediaHealth,
  uploadMedia,
  updateMediaMetadata,
  replaceMedia,
  deleteMedia,
  bulkDeleteMedia,
  bulkArchiveMedia,
  bulkRestoreMedia,
  reorderMedia,
} from './media.controller.js';

const router = Router();
const manageMedia = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, validate(listMediaQuerySchema), listMedia);
router.get('/library', protect, validate(mediaLibraryQuerySchema), browseMediaLibrary);
// Diagnostic report, not a casual read - runs a live Cloudinary check per
// asset, so it stays behind the privileged-role gate like the write routes.
router.get('/health', protect, manageMedia, getMediaHealth);
router.post('/upload', protect, manageMedia, handleMediaUpload, validate(uploadMediaSchema), uploadMedia);

router.patch('/reorder', protect, manageMedia, validate(reorderMediaSchema), reorderMedia);
router.post('/bulk-delete', protect, manageMedia, validate(bulkDeleteMediaSchema), bulkDeleteMedia);
router.patch('/bulk-archive', protect, manageMedia, validate(bulkMediaIdsSchema), bulkArchiveMedia);
router.patch('/bulk-restore', protect, manageMedia, validate(bulkMediaIdsSchema), bulkRestoreMedia);

router.get('/:id', protect, validate(mediaIdSchema), getMediaById);
router.get('/:id/details', protect, validate(mediaIdSchema), getMediaDetails);
router.get('/:id/usage', protect, validate(mediaIdSchema), getMediaUsage);
router.put('/:id', protect, manageMedia, validate(updateMediaMetadataSchema), updateMediaMetadata);
router.post('/:id/replace', protect, manageMedia, handleMediaUpload, validate(mediaIdSchema), replaceMedia);
router.delete('/:id', protect, manageMedia, validate(deleteMediaSchema), deleteMedia);

export default router;
