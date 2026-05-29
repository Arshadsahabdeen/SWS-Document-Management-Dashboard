const express = require("express");
const request = require("supertest");

jest.mock("../models/Document", () => ({
  find: jest.fn()
}));

const Document = require("../models/Document");
const documentRoutes = require("../routes/documentRoutes");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/documents", documentRoutes);
  return app;
};

describe("GET /api/documents", () => {
  it("returns documents list", async () => {
    const app = createTestApp();
    const documents = [
      {
        _id: "doc1",
        name: "Doc A",
        fileId: "file1",
        status: "complete"
      }
    ];

    Document.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(documents)
    });

    const response = await request(app).get("/api/documents");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.documents).toHaveLength(1);
    expect(response.body.documents[0].name).toBe("Doc A");
  });

  it("returns empty array when no documents exist", async () => {
    const app = createTestApp();

    Document.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    const response = await request(app).get("/api/documents");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.documents).toEqual([]);
  });
});
