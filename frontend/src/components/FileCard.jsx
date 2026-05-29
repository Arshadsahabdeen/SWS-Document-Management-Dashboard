import ProgressBar from "./ProgressBar.jsx";

const statusStyles = {
  pending: "bg-slate-100 text-slate-700",
  uploading: "bg-blue-100 text-blue-700",
  complete: "bg-emerald-100 text-emerald-700",
  failed: "bg-rose-100 text-rose-700"
};

function formatFileSize(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileCard({ file }) {
  const statusClass = statusStyles[file.status] || statusStyles.pending;

  return (
    <article className="dashboard-card p-4">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-brand-700 ring-1 ring-blue-100">
          PDF
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-semibold text-slate-900">
                {file.name}
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {formatFileSize(file.size)} <span className="px-1">.</span>{" "}
                {file.type || "application/pdf"}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass}`}
            >
              {file.status}
            </span>
          </div>
          <div className="mt-4">
            <ProgressBar value={file.progress} />
          </div>
          {file.status === "uploading" && (
            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-brand-700">
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-blue-200 border-t-brand-600" />
              Uploading
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export { formatFileSize };
export default FileCard;
