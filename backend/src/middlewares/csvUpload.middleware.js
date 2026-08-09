import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const ALLOWED_CSV_MIME_TYPES = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
const MAX_CSV_SIZE_BYTES = 5 * 1024 * 1024;

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_CSV_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a CSV file.`));
    return;
  }
  cb(null, true);
};

export const createCsvUploadMiddleware = (fieldName = 'file') => {
  const upload = multer({ storage: multer.memoryStorage(), fileFilter, limits: { fileSize: MAX_CSV_SIZE_BYTES } })
    .single(fieldName);

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err) return next(new ApiError(400, err.message || 'File upload failed'));
      if (!req.file) return next(new ApiError(400, 'No CSV file was uploaded'));
      next();
    });
  };
};
