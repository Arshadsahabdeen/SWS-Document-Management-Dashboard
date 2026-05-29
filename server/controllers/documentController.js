const mongoose = require("mongoose");

const { getDocumentsBucket } = require("../config/gridfs");
const Document = require("../models/Document");
const Notification = require("../models/Notification");

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getUploadedFiles = (req) => {
  if (Array.isArray(req.files)) {
    return req.files;
  }

  if (req.files && typeof req.files === "object") {
    return Object.values(req.files).flat();
  }

  return req.file ? [req.file] : [];
};

const deleteGridFsFile = async (fileId) => {
  try {
    await getDocumentsBucket().delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const uploadDocuments = async (req, res) => {
  const files = getUploadedFiles(req);

  try {
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    const documents = await Promise.all(
      files.map((file) =>
        Document.create({
          name: file.originalname,
          size: file.size,
          type: file.mimetype || file.contentType || "application/pdf",
          fileId: file.id,
          status: "complete"
        })
      )
    );

    if (files.length > 3) {
      await Notification.create({
        message: `Upload in progress - processing ${files.length} files in background.`,
        type: "info"
      });
    }

    return res.status(201).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    if (files.length) {
      try {
        await Promise.all(files.filter((file) => file.id).map((file) => deleteGridFsFile(file.id)));
      } catch (cleanupError) {
        console.error("Failed to clean up GridFS files:", cleanupError.message);
      }
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload documents"
    });
  }
};

const getDocuments = async (req, res) => {
  try {
    const documents = await Document.find().sort({ uploadDate: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch documents"
    });
  }
};

const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id"
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    const bucket = getDocumentsBucket();
    const fileId = new mongoose.Types.ObjectId(document.fileId);
    const files = await bucket.find({ _id: fileId }).toArray();

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "File not found"
      });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": files[0].length,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.name)}"`
    });

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on("error", () => {
      if (!res.headersSent) {
        return res.status(404).json({
          success: false,
          message: "File not found"
        });
      }

      return res.end();
    });

    return downloadStream.pipe(res);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to download document"
    });
  }
};

const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document id"
      });
    }

    const document = await Document.findById(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found"
      });
    }

    await deleteGridFsFile(document.fileId);
    await Document.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Document deleted successfully"
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete document"
    });
  }
};

module.exports = {
  uploadDocuments,
  getDocuments,
  downloadDocument,
  deleteDocument
};
