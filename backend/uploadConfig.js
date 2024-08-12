// uploadConfig.js
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads'))
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      if (err) return cb(err);
      cb(null, raw.toString('hex') + path.extname(file.originalname))
    });
  }
});

const fileFilter = function (req, file, cb) {
  console.log(`File upload attempt: ${file.originalname}`);
  
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  
  const mimeTypeAllowed = allowedMimeTypes.includes(file.mimetype);
  const extensionAllowed = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());
  
  if (mimeTypeAllowed && extensionAllowed) {
    console.log(`File accepted: ${file.originalname}`);
    return cb(null, true);
  } else {
    console.log(`File rejected: ${file.originalname}`);
    return cb(new Error('Only JPG, PNG and GIF image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: fileFilter
});

module.exports = upload;