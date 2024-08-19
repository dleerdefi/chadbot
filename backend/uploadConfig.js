const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

const randomBytes = promisify(crypto.randomBytes);

const uploadDir = process.env.UPLOAD_DIR || path.join(__dirname, 'uploads');
const MAX_FILE_SIZE = process.env.MAX_FILE_SIZE || 5 * 1024 * 1024; // 5MB default

const allowedMimeTypes = ['image/jpeg', 'image/png'];
const allowedExtensions = ['.jpg', '.jpeg', '.png'];

const errorMessages = {
  fileType: 'Only JPG and PNG image files are allowed.',
  fileSize: `File size should not exceed ${MAX_FILE_SIZE / (1024 * 1024)}MB.`
};

const sanitizeFilename = (filename) => {
  return filename.replace(/[^a-zA-Z0-9]/g, '_');
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir)
  },
  filename: async function (req, file, cb) {
    try {
      const raw = await randomBytes(16);
      const sanitizedName = sanitizeFilename(path.parse(file.originalname).name);
      cb(null, raw.toString('hex') + '_' + sanitizedName + path.extname(file.originalname));
    } catch (error) {
      console.error('Error generating filename:', error);
      cb(new Error('Error generating filename'));
    }
  }
});

const fileFilter = function (req, file, cb) {
  console.log(`File upload attempt: ${file.originalname}`);
  
  const mimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
  const extensionAllowed = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
  
  if (mimeTypeAllowed && extensionAllowed) {
    console.log(`File accepted: ${file.originalname}`);
    return cb(null, true);
  } else {
    console.log(`File rejected: ${file.originalname} - Invalid file type`);
    return cb(new Error(errorMessages.fileType), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter
});

// Custom error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      console.log(`File rejected: ${req.file.originalname} - File size exceeded`);
      return res.status(400).json({ error: errorMessages.fileSize });
    }
    console.error('Multer error:', err);
    return res.status(400).json({ error: 'File upload error' });
  }
  if (err) {
    console.error('File upload error:', err);
    return res.status(400).json({ error: err.message });
  }
  next();
};

module.exports = { upload, handleMulterError };