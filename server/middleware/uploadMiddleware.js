const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const { GridFsStorage } = require("multer-gridfs-storage");

const MAX_FILE_SIZE = 20 * 1024 * 1024;

const storage = new GridFsStorage({
  db: mongoose.connection.asPromise().then(() => mongoose.connection.db),
  file: (req, file) => {
    const timestamp = Date.now();
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");

    return {
      bucketName: "documents",
      filename: `${timestamp}-${safeOriginalName}`,
      contentType: "application/pdf",
      metadata: {
        originalName: file.originalname
      }
    };
  }
});

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
    files: 20
  }
});

module.exports = upload;
