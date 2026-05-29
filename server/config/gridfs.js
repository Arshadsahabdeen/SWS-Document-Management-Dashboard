const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const BUCKET_NAME = "documents";

let bucket;

const getDocumentsBucket = () => {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection is not ready");
  }

  if (!bucket) {
    bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: BUCKET_NAME
    });
  }

  return bucket;
};

module.exports = {
  BUCKET_NAME,
  getDocumentsBucket
};
