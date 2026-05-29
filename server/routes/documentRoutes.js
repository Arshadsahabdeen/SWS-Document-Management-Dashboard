const express = require("express");
const {
  uploadDocuments,
  getDocuments,
  downloadDocument,
  deleteDocument
} = require("../controllers/documentController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post("/upload", upload.array("files", 20), uploadDocuments);
router.get("/", getDocuments);
router.get("/download/:id", downloadDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
