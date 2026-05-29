import { useEffect, useRef, useState } from "react";
import { Route, Routes } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from "./services/api.js";
import socket from "./services/socket.js";

function App() {
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(true);
  const hasLoadedNotifications = useRef(false);

  const unreadCount = notifications.filter((notification) => !notification.read).length;

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

  useEffect(() => {
    if (!hasLoadedNotifications.current) {
      hasLoadedNotifications.current = true;
      loadNotifications();
    }

    const handleNotification = (notification) => {
      setNotifications((current) => {
        if (current.some((item) => item._id === notification._id)) {
          return current;
        }

        return [notification, ...current];
      });

      if (notification.type === "success") {
        toast.success(notification.message);
      } else if (notification.type === "error") {
        toast.error(notification.message);
      } else {
        toast(notification.message);
      }
    };

    socket.on("notification", handleNotification);

    return () => {
      socket.off("notification", handleNotification);
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
