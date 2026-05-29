const path = require("path");
const multer = require("multer");

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const MAX_FILES = 20;

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isPdfMime = file.mimetype === "application/pdf";
  const isPdfExtension = path.extname(file.originalname).toLowerCase() === ".pdf";

  if (!isPdfMime || !isPdfExtension) {
    return cb(new Error("Only PDF files are allowed"));
  }

  return cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES
  }
});

module.exports = upload;
