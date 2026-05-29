const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  size: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ["pending", "uploading", "complete", "failed"],
    default: "pending"
  },
  uploadDate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Document", documentSchema);
