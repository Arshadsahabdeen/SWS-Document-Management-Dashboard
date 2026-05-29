import { Route, Routes } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import DocumentsPage from "./pages/DocumentsPage.jsx";
import NotificationsPage from "./pages/NotificationsPage.jsx";

function App() {
  return (
    <div className="min-h-screen bg-slate-50 font-livvic text-slate-900">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl px-4 pb-10 pt-24 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<UploadPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
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
