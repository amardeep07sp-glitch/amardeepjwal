import multer from 'multer';
import { ApiError } from '../../utils/ApiError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['text/csv', 'application/vnd.ms-excel', 'text/plain'];
  if (!allowed.includes(file.mimetype)) {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Please upload a CSV file.`));
    return;
  }
  cb(null, true);
};

// Never written to disk - held in memory only long enough to parse. Same
// small, per-module multer config precedent as inventory.upload.middleware.js.
const csvUpload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } }).single('file');

export const handleCustomerCsvUpload = (req, res, next) => {
  csvUpload(req, res, (err) => {
    if (err) return next(new ApiError(400, err.message || 'File upload failed'));
    if (!req.file) return next(new ApiError(400, 'No CSV file was uploaded'));
    next();
  });
};
