import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { deleteDocument, downloadDocument, getDocuments } from "../services/api.js";
import { formatFileSize } from "../components/FileCard.jsx";

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function getDownloadName(response, fallback) {
  const disposition = response.headers["content-disposition"];
  const match = disposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1] || fallback || "document.pdf";
}

function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const loadDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await getDocuments();
      setDocuments(response.data?.documents || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load documents");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();

    const refresh = () => loadDocuments();
    window.addEventListener("documents:refresh", refresh);

    return () => window.removeEventListener("documents:refresh", refresh);
  }, []);

  const handleDownload = async (document) => {
    try {
      const response = await downloadDocument(document._id);
      const href = URL.createObjectURL(response.data);
      const link = window.document.createElement("a");

      link.href = href;
      link.download = getDownloadName(response, document.name);
      window.document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (error) {
      toast.error(error.response?.data?.message || "Download failed");
    }
  };

  const handleDelete = async (id) => {
    try {
      setDeletingId(id);
      await deleteDocument(id);
      setDocuments((current) => current.filter((document) => document._id !== id));
      toast.success("Document deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
          Repository
        </p>
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Documents</h1>
      </div>

      <section className="dashboard-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Uploaded Files</h2>
          <button type="button" className="secondary-button" onClick={loadDocuments}>
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-blue-100">
            <thead className="bg-blue-50">
              <tr>
                {["Name", "Size", "Upload Date", "Status", "Actions"].map((heading) => (
                  <th
                    key={heading}
                    className="px-5 py-3 text-left text-xs font-bold uppercase tracking-wide text-slate-600"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-blue-50 bg-white">
              {isLoading ? (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-brand-700">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-brand-600" />
                      Loading documents
                    </span>
                  </td>
                </tr>
              ) : documents.length ? (
                documents.map((document) => (
                  <tr key={document._id} className="transition hover:bg-blue-50/50">
                    <td className="max-w-xs truncate px-5 py-4 text-sm font-semibold text-slate-900">
                      {document.name}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatFileSize(document.size)}
                    </td>
                    <td className="px-5 py-4 text-sm text-slate-600">
                      {formatDate(document.uploadDate)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold capitalize text-emerald-700">
                        {document.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="secondary-button px-3 py-2"
                          onClick={() => handleDownload(document)}
                        >
                          Download
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300"
                          disabled={deletingId === document._id}
                          onClick={() => handleDelete(document._id)}
                        >
                          {deletingId === document._id ? "Deleting" : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                    No documents found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

export default DocumentsPage;
