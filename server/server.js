const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const { Server } = require("socket.io");
const multer = require("multer");

const connectDB = require("./config/db");
const documentRoutes = require("./routes/documentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PATCH"]
  }
});

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/documents", documentRoutes);
app.use("/api/notifications", notificationRoutes);

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on("disconnect", () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found"
  });
});

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

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
