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
  const totalStorage = documents.reduce((sum, document) => sum + (document.size || 0), 0);
  const lastUpload = documents
    .map((document) => document.uploadDate || document.createdAt)
    .filter(Boolean)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0];

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
      await loadDocuments();
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
        <h1 className="mt-1 text-3xl font-bold text-slate-950">Document Repository</h1>
      </div>

      <section className="dashboard-card p-5">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Documents
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{documents.length}</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Total Storage
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {formatFileSize(totalStorage)}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Last Upload
            </p>
            <p className="mt-2 text-2xl font-bold text-slate-950">
              {lastUpload ? formatDate(lastUpload) : "-"}
            </p>
          </div>
        </div>
      </section>

      <section className="dashboard-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-blue-100 px-5 py-4">
          <h2 className="text-lg font-bold text-slate-950">Managed Documents</h2>
          <button type="button" className="secondary-button" onClick={loadDocuments}>
            Refresh
          </button>
        </div>

        <div className="max-h-[480px] overflow-x-auto overflow-y-auto">
          <table className="min-w-full divide-y divide-blue-100">
            <thead className="sticky top-0 z-10 bg-blue-50">
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
                          <span className="flex items-center gap-2">
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M12 4v10m0 0 4-4m-4 4-4-4"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M4 18h16"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                            </svg>
                            Download
                          </span>
                        </button>
                        <button
                          type="button"
                          className="rounded-xl border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-rose-300"
                          disabled={deletingId === document._id}
                          onClick={() => handleDelete(document._id)}
                        >
                          <span className="flex items-center gap-2">
                            <svg
                              aria-hidden="true"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <path
                                d="M4 7h16"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                              />
                              <path
                                d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                              <path
                                d="M7 7l1 12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2l1-12"
                                stroke="currentColor"
                                strokeWidth="1.5"
                              />
                            </svg>
                            {deletingId === document._id ? "Deleting" : "Delete"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-5 py-10 text-center text-sm font-medium text-slate-500">
                    No documents uploaded yet. Upload your first PDF to begin.
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
