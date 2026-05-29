import { useEffect, useMemo, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.jsx";
import DashboardHeader from "./components/DashboardHeader.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import {
  getDocuments,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "./services/api.js";
import socket from "./services/socket.js";
import { formatFileSize } from "./components/FileCard.jsx";

function App() {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [isDocumentsLoading, setIsDocumentsLoading] = useState(true);
  const hasLoadedNotifications = useRef(false);
  const hasLoadedDocuments = useRef(false);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const totalStorage = useMemo(
    () => documents.reduce((sum, document) => sum + (document.size || 0), 0),
    [documents]
  );

  const recentUploads = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return documents.filter((document) => {
      const dateValue = document.uploadDate || document.createdAt;
      const timestamp = dateValue ? new Date(dateValue).getTime() : 0;
      return timestamp >= cutoff;
    }).length;
  }, [documents]);

  const loadNotifications = async () => {
    try {
      setIsNotificationsLoading(true);
      const response = await getNotifications();
      setNotifications(response.data?.notifications || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load notifications");
    } finally {
      setIsNotificationsLoading(false);
    }
  };

  const loadDocuments = async () => {
    try {
      setIsDocumentsLoading(true);
      const response = await getDocuments();
      setDocuments(response.data?.documents || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load documents");
    } finally {
      setIsDocumentsLoading(false);
    }
  };

  useEffect(() => {
    if (!hasLoadedNotifications.current) {
      hasLoadedNotifications.current = true;
      loadNotifications();
    }

    if (!hasLoadedDocuments.current) {
      hasLoadedDocuments.current = true;
      loadDocuments();
    }

    const handleNotification = (notification) => {
      let isNew = false;

      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }

        isNew = true;
        return [notification, ...current];
      });

      if (!isNew) {
        return;
      }

      if (notification.type === "success") {
        toast.success(notification.message);
      } else if (notification.type === "error") {
        toast.error(notification.message);
      } else {
        toast(notification.message);
      }
    };

    socket.on("notification", handleNotification);

    const refreshDocuments = () => loadDocuments();
    window.addEventListener("documents:refresh", refreshDocuments);

    return () => {
      socket.off("notification", handleNotification);
      window.removeEventListener("documents:refresh", refreshDocuments);
    };
  }, []);

  const handleMarkNotificationRead = async (id) => {
    const response = await markNotificationRead(id);
    const updatedNotification = response.data?.notification;

    setNotifications((current) =>
      current.map((notification) =>
        notification._id === id
          ? updatedNotification || { ...notification, read: true }
          : notification
      )
    );
  };

  const handleMarkAllNotificationsRead = async () => {
    await markAllNotificationsRead();
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, read: true }))
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 font-livvic text-slate-900">
      <Navbar unreadCount={unreadCount} />
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <DashboardHeader
          title="FileMaster"
          subtitle="Smart Document Management Platform"
          isLoading={isDocumentsLoading && !documents.length}
          metrics={[
            {
              label: "Total Documents",
              value: documents.length.toString(),
              helper: "All managed files",
              accent: "blue",
              icon: (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 4h7l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M13 4v5h5" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )
            },
            {
              label: "Storage Used",
              value: formatFileSize(totalStorage),
              helper: "Across GridFS",
              accent: "emerald",
              icon: (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M4 7a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V7z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M8 12h8" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                  />
                </svg>
              )
            },
            {
              label: "Unread Notifications",
              value: unreadCount.toString(),
              helper: "Requires review",
              accent: "rose",
              icon: (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M6 8a6 6 0 1 1 12 0v5l2 3H4l2-3V8z"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                  <path d="M10 20h4" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              )
            },
            {
              label: "Recent Uploads",
              value: recentUploads.toString(),
              helper: "Last 7 days",
              accent: "amber",
              icon: (
                <svg
                  aria-hidden="true"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M12 6v6l4 2" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                  />
                  <path
                    d="M12 22a10 10 0 1 1 10-10" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                  />
                </svg>
              )
            }
          ]}
        />
        <div className="mt-8">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route
            path="/notifications"
            element={
              <NotificationsPage
                notifications={notifications}
                isLoading={isNotificationsLoading}
                unreadCount={unreadCount}
                onMarkRead={handleMarkNotificationRead}
                onMarkAllRead={handleMarkAllNotificationsRead}
                onRefresh={loadNotifications}
              />
            }
          />
        </Routes>
        </div>
      </main>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          className: "font-livvic",
          success: {
            style: {
              background: "#eff6ff",
              color: "#1e3a8a",
              border: "1px solid #bfdbfe"
            }
          },
          error: {
            style: {
              background: "#fff1f2",
              color: "#9f1239",
              border: "1px solid #fecdd3"
            }
          }
        }}
      />
    </div>
  );
}

export default App;
