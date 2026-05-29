const express = require("express");
const request = require("supertest");
const multer = require("multer");
const { Writable } = require("stream");
const mongoose = require("mongoose");

const mockBucket = {
  openUploadStream: jest.fn()
};

jest.mock("../config/gridfs", () => ({
  BUCKET_NAME: "documents",
  getDocumentsBucket: jest.fn(() => mockBucket)
}));

jest.mock("../models/Document", () => ({
  insertMany: jest.fn(),
  find: jest.fn(),
  collection: {
    find: jest.fn()
  }
}));

jest.mock("../models/Notification", () => ({
  create: jest.fn()
}));

const Document = require("../models/Document");
const documentRoutes = require("../routes/documentRoutes");

const createUploadStream = () => {
  const stream = new Writable({
    write(_chunk, _encoding, callback) {
      callback();
    }
  });

  stream.id = new mongoose.Types.ObjectId();
  return stream;
};

const createTestApp = () => {
  const app = express();
  app.set("io", { emit: jest.fn() });
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api/documents", documentRoutes);

  app.use((err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || "Internal server error";

    if (err instanceof multer.MulterError) {
      statusCode = 400;

      if (err.code === "LIMIT_FILE_SIZE") {
        message = "File size cannot exceed 20MB";
      }

      if (err.code === "LIMIT_FILE_COUNT") {
        message = "Cannot upload more than 20 files at once";
      }

      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        message = "Unexpected file field";
      }
    } else if (message === "Only PDF files are allowed") {
      statusCode = 400;
    }

    res.status(statusCode).json({
      success: false,
      message
    });
  });

  return app;
};

describe("POST /api/documents/upload", () => {
  beforeEach(() => {
    mockBucket.openUploadStream.mockImplementation(() => createUploadStream());
  });

  it("uploads a valid PDF and creates document and GridFS file", async () => {
    const app = createTestApp();
    const pdfBuffer = Buffer.from("%PDF-1.4\n%Test file\n");
    const createdDocuments = [
      {
        _id: new mongoose.Types.ObjectId(),
        name: "sample.pdf",
        fileId: new mongoose.Types.ObjectId(),
        status: "complete"
      }
    ];

    Document.insertMany.mockResolvedValue(createdDocuments);

    const response = await request(app)
      .post("/api/documents/upload")
      .attach("files", pdfBuffer, {
        filename: "sample.pdf",
        contentType: "application/pdf"
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.documents).toHaveLength(1);
    expect(Document.insertMany).toHaveBeenCalledTimes(1);
    expect(mockBucket.openUploadStream).toHaveBeenCalledTimes(1);
    expect(mockBucket.openUploadStream.mock.calls[0][0]).toContain("sample.pdf");
  });

  it("returns 400 when no files are provided", async () => {
    const app = createTestApp();

    const response = await request(app).post("/api/documents/upload");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("No files uploaded");
  });

  it("returns 400 for invalid file type", async () => {
    const app = createTestApp();

    const response = await request(app)
      .post("/api/documents/upload")
      .attach("files", Buffer.from("not a pdf"), {
        filename: "notes.txt",
        contentType: "text/plain"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Only PDF files are allowed");
  });

  it("returns 400 for oversized file", async () => {
    const app = createTestApp();
    const oversizedBuffer = Buffer.alloc(20 * 1024 * 1024 + 1, 1);

    const response = await request(app)
      .post("/api/documents/upload")
      .attach("files", oversizedBuffer, {
        filename: "big.pdf",
        contentType: "application/pdf"
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("File size cannot exceed 20MB");
  });
});
