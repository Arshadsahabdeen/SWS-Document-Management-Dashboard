const { Readable } = require("stream");
const mongoose = require("mongoose");

const { BUCKET_NAME, getDocumentsBucket } = require("../config/gridfs");
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

const escapeHeaderValue = (value) => String(value).replace(/["\\\r\n]/g, "_");

const toObjectId = (id) => {
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  return new mongoose.Types.ObjectId(id);
};

const normalizeObjectId = (id) => {
  const objectId = toObjectId(id);
  return objectId ? objectId.toString() : null;
};

const getLegacyBasename = (value) => {
  if (!value) {
    return null;
  }

  return String(value).split(/[\\/]/).pop();
};

const isGridFsFileNotFoundError = (error) => {
  const message = error?.message?.toLowerCase() || "";
  return (
    error?.code === "ENOENT" ||
    error?.code === "FileNotFound" ||
    error?.code === 26 ||
    message.includes("file not found") ||
    message.includes("filenotfound")
  );
};

const createAndEmitNotification = async (req, payload) => {
  const notification = await Notification.create({
    ...payload,
    timestamp: new Date()
  });
  const io = req.app.get("io");

  if (io) {
    io.emit("notification", notification);
  }

  return notification;
};

const deleteGridFsFile = async (fileId) => {
  const objectId = toObjectId(fileId);

  if (!objectId) {
    return false;
  }

  try {
    await getDocumentsBucket().delete(objectId);
    return true;
  } catch (error) {
    if (isGridFsFileNotFoundError(error)) {
      return false;
    }

    throw error;
  }
};

const uploadFileToGridFs = (file) =>
  new Promise((resolve, reject) => {
    const bucket = getDocumentsBucket();
    const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${Date.now()}-${safeOriginalName}`;
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: "application/pdf",
      metadata: {
        originalName: file.originalname
      }
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve({
        id: uploadStream.id
      });
    });

    Readable.from(file.buffer).pipe(uploadStream);
  });

const getStorageIntegritySnapshot = async () => {
  const bucket = getDocumentsBucket();
  const rawDocuments = await Document.collection.find({}).toArray();
  const gridFsFiles = await bucket.find({}).toArray();
  const documentFileIdSet = new Set(
    rawDocuments.map((document) => normalizeObjectId(document.fileId)).filter(Boolean)
  );
  const gridFsFileIdSet = new Set(
    gridFsFiles.map((file) => normalizeObjectId(file._id)).filter(Boolean)
  );

  const missingGridFSFiles = rawDocuments
    .filter((document) => {
      const fileId = normalizeObjectId(document.fileId);
      return !fileId || !gridFsFileIdSet.has(fileId);
    })
    .map((document) => ({
      documentId: document._id,
      name: document.name,
      fileId: document.fileId || null,
      hasLegacyPath: Boolean(document.path),
      path: document.path || null,
      legacyBasename: getLegacyBasename(document.path)
    }));

  const orphanedGridFSFiles = gridFsFiles
    .filter((file) => {
      const fileId = normalizeObjectId(file._id);
      return fileId && !documentFileIdSet.has(fileId);
    })
    .map((file) => ({
      fileId: file._id,
      filename: file.filename,
      originalName: file.metadata?.originalName || null,
      length: file.length,
      contentType: file.contentType || "application/pdf",
      uploadDate: file.uploadDate
    }));

  return {
    totalDocuments: rawDocuments.length,
    totalGridFSFiles: gridFsFiles.length,
    missingMetadata: orphanedGridFSFiles,
    missingGridFSFiles,
    orphanedGridFSFiles,
    healthy: missingGridFSFiles.length === 0 && orphanedGridFSFiles.length === 0
  };
};

const uploadDocuments = async (req, res) => {
  const files = getUploadedFiles(req);
  const uploadedGridFiles = [];

  try {
    if (!files.length) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded"
      });
    }

    if (files.length > 3) {
      await createAndEmitNotification(req, {
        message: `Upload in progress \u2014 processing ${files.length} files in background.`,
        type: "info"
      });
    }

    for (const file of files) {
      const gridFile = await uploadFileToGridFs(file);
      uploadedGridFiles.push({ ...gridFile, sourceFile: file });
    }

    const documents = await Document.insertMany(
      uploadedGridFiles.map(({ id, sourceFile }) => ({
        name: sourceFile.originalname,
        size: sourceFile.size,
        type: sourceFile.mimetype,
        fileId: id,
        status: "complete"
      }))
    );

    if (files.length > 3) {
      await createAndEmitNotification(req, {
        message: `${files.length} files uploaded successfully`,
        type: "success"
      });
    }

    return res.status(201).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    if (uploadedGridFiles.length) {
      try {
        await Promise.all(uploadedGridFiles.map((file) => deleteGridFsFile(file.id)));
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
    const documents = await Document.find({}).sort({
      uploadDate: -1
    });

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

const getStorageIntegrity = async (req, res) => {
  try {
    const integrity = await getStorageIntegritySnapshot();

    return res.status(200).json({
      success: true,
      ...integrity
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to inspect storage integrity"
    });
  }
};

const repairStorage = async (req, res) => {
  try {
    const before = await getStorageIntegritySnapshot();
    const orphanPool = new Map(
      before.orphanedGridFSFiles.map((file) => [normalizeObjectId(file.fileId), file])
    );
    const repairedMetadata = [];
    const unrepairedMissingGridFSFiles = [];
    const removedGridFSFileIds = [];

    for (const document of before.missingGridFSFiles) {
      const match = Array.from(orphanPool.values()).find((file) => {
        const names = [file.originalName, file.filename].filter(Boolean);
        const documentNames = [document.name, document.legacyBasename].filter(Boolean);

        return documentNames.some((documentName) => names.includes(documentName));
      });

      if (!match) {
        unrepairedMissingGridFSFiles.push(document);
        continue;
      }

      await Document.collection.updateOne(
        { _id: document.documentId },
        {
          $set: {
            fileId: match.fileId,
            name: document.name || match.originalName || match.filename,
            size: match.length,
            type: match.contentType || "application/pdf",
            status: "complete"
          },
          $unset: {
            path: ""
          }
        }
      );

      repairedMetadata.push({
        documentId: document.documentId,
        fileId: match.fileId,
        name: document.name || match.originalName || match.filename
      });
      orphanPool.delete(normalizeObjectId(match.fileId));
    }

    const removedMetadataIds = unrepairedMissingGridFSFiles.map((item) => item.documentId);

    if (removedMetadataIds.length) {
      await Document.deleteMany({ _id: { $in: removedMetadataIds } });
    }

    for (const file of orphanPool.values()) {
      const removed = await deleteGridFsFile(file.fileId);

      if (removed) {
        removedGridFSFileIds.push(file.fileId);
      }
    }

    const after = await getStorageIntegritySnapshot();

    return res.status(200).json({
      success: true,
      message: "Storage repair completed",
      repair: {
        repairedMetadataCount: repairedMetadata.length,
        repairedMetadata,
        removedBrokenMetadataCount: removedMetadataIds.length,
        removedBrokenMetadataIds: removedMetadataIds,
        removedOrphanedGridFSFileCount: removedGridFSFileIds.length,
        removedOrphanedGridFSFileIds: removedGridFSFileIds,
        pathBasedRecordsConverted: repairedMetadata.filter((item) =>
          before.missingGridFSFiles.some(
            (document) =>
              document.hasLegacyPath &&
              normalizeObjectId(document.documentId) === normalizeObjectId(item.documentId)
          )
        ).length,
        pathBasedRecordsRemoved: unrepairedMissingGridFSFiles.filter((item) => item.hasLegacyPath)
          .length,
        bucketName: BUCKET_NAME
      },
      before,
      after
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to repair storage"
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

    const fileId = toObjectId(document.fileId);

    if (!fileId) {
      return res.status(409).json({
        success: false,
        message: "Document is missing a valid GridFS fileId"
      });
    }

    const bucket = getDocumentsBucket();
    const files = await bucket.find({ _id: fileId }).limit(1).toArray();

    if (!files.length) {
      return res.status(404).json({
        success: false,
        message: "GridFS file not found for this document"
      });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Length": files[0].length,
      "Content-Disposition": `attachment; filename="${escapeHeaderValue(document.name)}"`
    });

    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on("error", () => {
      if (!res.headersSent) {
        return res.status(404).json({
          success: false,
          message: "GridFS file not found for this document"
        });
      }

      return res.destroy();
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

    const gridFsDeleted = await deleteGridFsFile(document.fileId);
    await Document.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: gridFsDeleted
        ? "Document deleted successfully"
        : "Metadata deleted; GridFS file was already missing",
      gridFsDeleted,
      metadataDeleted: true
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
  getStorageIntegrity,
  repairStorage,
  downloadDocument,
  deleteDocument
};
