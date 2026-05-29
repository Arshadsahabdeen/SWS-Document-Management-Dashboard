import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import FileCard from "../components/FileCard.jsx";
import UploadZone from "../components/UploadZone.jsx";
import { uploadDocuments } from "../services/api.js";

const MAX_FILES = 20;

const createFileItem = (file) => ({
  id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
  raw: file,
  name: file.name,
  size: file.size,
  type: file.type || "application/pdf",
  status: "pending",
  progress: 0
});

function calculateFileProgress(files, loadedBytes) {
  let consumedBytes = 0;

  return files.map((file) => {
    const start = consumedBytes;
    const end = consumedBytes + file.size;
    consumedBytes = end;

    if (loadedBytes >= end) return 100;
    if (loadedBytes <= start) return 0;

    return Math.round(((loadedBytes - start) / file.size) * 100);
  });
}

function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const hasFiles = selectedFiles.length > 0;
  const canUpload = hasFiles && !isUploading;

  const totalSize = useMemo(
    () => selectedFiles.reduce((sum, file) => sum + file.size, 0),
    [selectedFiles]
  );

  const handleFilesSelected = (files) => {
    const pdfFiles = files.filter(
      (file) => file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
    );

    if (pdfFiles.length !== files.length) {
      toast.error("Only PDF files are allowed");
    }

    if (!pdfFiles.length) {
      return;
    }

    const remainingSlots = MAX_FILES - selectedFiles.length;

    if (remainingSlots <= 0) {
      toast.error("Maximum 20 files can be uploaded at once");
      return;
    }

    const filesToAdd = pdfFiles.slice(0, remainingSlots);

    if (pdfFiles.length > remainingSlots) {
      toast.error("Only the first 20 files were added");
    }

    setSelectedFiles((current) => [...current, ...filesToAdd.map(createFileItem)]);
  };

  const handleUpload = async () => {
    if (!selectedFiles.length) {
      toast.error("Select at least one PDF file");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file.raw);
    });

    setIsUploading(true);
    setSelectedFiles((current) =>
      current.map((file) => ({ ...file, status: "uploading", progress: 0 }))
    );

    if (selectedFiles.length > 3) {
      toast(`Upload in progress — processing ${selectedFiles.length} files in background.`);
    }

    try {
      const response = await uploadDocuments(formData, (event) => {
        const loaded = event.loaded || 0;
        const progressByFile = calculateFileProgress(selectedFiles, loaded);

        setSelectedFiles((current) =>
          current.map((file, index) => ({
            ...file,
            progress: progressByFile[index] || 0,
            status: progressByFile[index] >= 100 ? "complete" : "uploading"
          }))
        );
      });

      const uploadedCount = response.data?.count || selectedFiles.length;

      setSelectedFiles((current) =>
        current.map((file) => ({ ...file, status: "complete", progress: 100 }))
      );
      window.dispatchEvent(new Event("documents:refresh"));
      toast.success(`${uploadedCount} file${uploadedCount === 1 ? "" : "s"} uploaded successfully`);
    } catch (error) {
      const message = error.response?.data?.message || "Upload failed";

      setSelectedFiles((current) =>
        current.map((file) => ({ ...file, status: "failed" }))
      );
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const clearFiles = () => {
    if (!isUploading) {
      setSelectedFiles([]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">
            Upload Center
          </p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">
            Company PDF Documents
          </h1>
        </div>
        <div className="flex gap-3">
          <button
            type="button"
            className="secondary-button"
            disabled={!hasFiles || isUploading}
            onClick={clearFiles}
          >
            Clear
          </button>
          <button
            type="button"
            className="primary-button"
            disabled={!canUpload}
            onClick={handleUpload}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Uploading
              </span>
            ) : (
              "Upload Files"
            )}
          </button>
        </div>
      </div>

      <UploadZone onFilesSelected={handleFilesSelected} disabled={isUploading} />

      <section className="dashboard-card p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Selected Files</h2>
            <p className="text-sm text-slate-500">
              {selectedFiles.length} file{selectedFiles.length === 1 ? "" : "s"} selected
              {totalSize > 0 ? ` · ${(totalSize / (1024 * 1024)).toFixed(1)} MB total` : ""}
            </p>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-brand-700">
            Max {MAX_FILES} files
          </span>
        </div>

        {selectedFiles.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {selectedFiles.map((file) => (
              <FileCard key={file.id} file={file} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-blue-50/60 p-8 text-center text-sm font-medium text-slate-500">
            No files selected
          </div>
        )}
      </section>
    </div>
  );
}

export default UploadPage;
