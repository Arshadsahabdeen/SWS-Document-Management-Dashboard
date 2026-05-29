const express = require("express");
const {
  uploadDocuments,
  getDocuments,
  getStorageIntegrity,
  repairStorage,
  downloadDocument,
  deleteDocument
} = require("../controllers/documentController");
const upload = require("../middleware/uploadMiddleware");

const router = express.Router();

router.post(
  "/upload",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "files", maxCount: 20 }
  ]),
  uploadDocuments
);
router.get("/", getDocuments);
router.get("/storage-integrity", getStorageIntegrity);
router.post("/storage-repair", repairStorage);
router.get("/download/:id", downloadDocument);
router.delete("/:id", deleteDocument);

module.exports = router;
