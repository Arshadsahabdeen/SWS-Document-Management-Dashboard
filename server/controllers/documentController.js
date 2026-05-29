const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const Document = require("../models/Document");
const Notification = require("../models/Notification");

const removeFileIfExists = async (filePath) => {
  if (!filePath) {
    return;
  }

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const uploadDocuments = async (req, res) => {
  try {
    const files = req.files || [];

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
          type: file.mimetype,
          path: file.path,
          status: "complete"
        })
      )
    );

    if (files.length > 3) {
      await Notification.create({
        message: `Upload in progress — processing ${files.length} files in background.`,
        type: "info"
      });
    }

    return res.status(201).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    if (req.files && req.files.length) {
      try {
        await Promise.all(req.files.map((file) => removeFileIfExists(file.path)));
      } catch (cleanupError) {
        console.error("Failed to clean up uploaded files:", cleanupError.message);
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

    const filePath = path.resolve(document.path);
    const fileExists = fs.existsSync(filePath);

    if (!fileExists) {
      return res.status(404).json({
        success: false,
        message: "File not found on disk"
      });
    }

    return res.download(filePath, document.name, (error) => {
      if (error && !res.headersSent) {
        return res.status(500).json({
          success: false,
          message: "Failed to download document"
        });
      }
    });
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

    await removeFileIfExists(document.path);
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
