const express = require("express");
const request = require("supertest");
const mongoose = require("mongoose");

jest.mock("../models/Notification", () => ({
  find: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateMany: jest.fn()
}));

const Notification = require("../models/Notification");
const notificationRoutes = require("../routes/notificationRoutes");

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api/notifications", notificationRoutes);
  return app;
};

describe("GET /api/notifications", () => {
  it("returns notifications", async () => {
    const app = createTestApp();
    const notifications = [
      {
        _id: "n1",
        message: "Upload done",
        type: "success",
        read: false
      }
    ];

    Notification.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue(notifications)
    });

    const response = await request(app).get("/api/notifications");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.unreadCount).toBe(1);
    expect(response.body.notifications).toHaveLength(1);
  });

  it("returns empty array", async () => {
    const app = createTestApp();

    Notification.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([])
    });

    const response = await request(app).get("/api/notifications");

    expect(response.status).toBe(200);
    expect(response.body.notifications).toEqual([]);
  });
});

describe("PATCH /api/notifications/:id/read", () => {
  it("marks notification as read", async () => {
    const app = createTestApp();
    const id = new mongoose.Types.ObjectId();
    const updated = {
      _id: id,
      message: "Upload done",
      type: "success",
      read: true
    };

    Notification.findByIdAndUpdate.mockResolvedValue(updated);

    const response = await request(app).patch(`/api/notifications/${id}/read`);

    expect(response.status).toBe(200);
    expect(response.body.notification.read).toBe(true);
  });

  it("returns 400 for invalid notification id", async () => {
    const app = createTestApp();

    const response = await request(app).patch("/api/notifications/bad-id/read");

    expect(response.status).toBe(400);
    expect(response.body.message).toBe("Invalid notification id");
    expect(Notification.findByIdAndUpdate).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/notifications/read-all", () => {
  it("marks all notifications as read", async () => {
    const app = createTestApp();

    Notification.updateMany.mockResolvedValue({ modifiedCount: 3 });

    const response = await request(app).patch("/api/notifications/read-all");

    expect(response.status).toBe(200);
    expect(response.body.modifiedCount).toBe(3);
  });
});
