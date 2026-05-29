import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api"
});

export const uploadDocuments = (formData, onUploadProgress) =>
  api.post("/documents/upload", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    },
    onUploadProgress
  });

export const getDocuments = () => api.get("/documents");

export const getStorageIntegrity = () => api.get("/documents/storage-integrity");

export const repairStorage = () => api.post("/documents/storage-repair");

export const deleteDocument = (id) => api.delete(`/documents/${id}`);

export const downloadDocument = (id) =>
  api.get(`/documents/download/${id}`, {
    responseType: "blob"
  });

export const getNotifications = () => api.get("/notifications");

export const markNotificationRead = (id) =>
  api.patch(`/notifications/${id}/read`);

export const markAllNotificationsRead = () =>
  api.patch("/notifications/read-all");

export default api;
