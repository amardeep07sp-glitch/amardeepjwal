import { mediaService } from '../media/media.service.js';

// Shared by support tickets and issue reports (Phase 33) - both let a
// customer attach evidence files to an entity that already exists (the
// ticket/issue is created first, then its id is the entityId every
// attachment uploads against) via the SAME Cloudinary-backed pipeline
// every other module already uses, never a bespoke upload path.
export async function uploadAttachments(files, entityType, entityId, userId) {
  if (!files?.length) return [];
  const uploads = await Promise.all(files.map((file) => mediaService.uploadMedia({ entityType, entityId, file }, userId)));
  return uploads.map((m) => m.id);
}
