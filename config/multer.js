const multer = require('multer');
const path = require('path');

// Define storage settings
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads')); // Directory to store images
  },
  filename: (req, file, cb) => {
    const extension = path.extname(file.originalname);
    const fileName = file.originalname
      .split(' ')
      .join('-')
      .replace(extension, '');
    cb(null, `${fileName}-${Date.now()}${extension}`); // Use timestamp to avoid filename conflicts
  },
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png/;
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, JPG, and PNG are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
});

module.exports = upload;
