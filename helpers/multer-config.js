// const multer= require('multer');

// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage, limits: {
//     fieldSize: 10 * 1024 * 1024, // 10 MB field size limit for text fields
//     fileSize: 5 * 1024 * 1024}, });

// module.exports = upload;

const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/content/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = file.fieldname + '-' + uniqueSuffix + ext;
    cb(null, filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fieldSize: 10 * 1024 * 1024,
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;



// const multer = require('multer');
// const path = require('path');

// const storage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './uploads/content/');
//   },
//   filename: function (req, file, cb) {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     const ext = path.extname(file.originalname);
//     cb(null, file.fieldname + '-' + uniqueSuffix + ext);
//   }
// });

// const upload = multer({
//   storage: storage,
//   limits: {
//     fieldSize: 10 * 1024 * 1024,
//     fileSize: 5 * 1024 * 1024    
//   }
// });

// module.exports = upload;
