import { useRef, useState } from "react";

function UploadZone({ onFilesSelected, disabled = false }) {
  const inputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (fileList) => {
    const files = Array.from(fileList || []);
    if (files.length) {
      onFilesSelected(files);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!disabled) {
      handleFiles(event.dataTransfer.files);
    }
  };

  return (
    <section
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`dashboard-card border-2 border-dashed p-10 text-center transition ${
        isDragging ? "border-brand-600 bg-blue-50" : "border-blue-200 bg-white"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        multiple
        className="hidden"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
      />
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 text-base font-bold text-brand-700 ring-1 ring-blue-100">
        PDF
      </div>
      <h2 className="mt-6 text-2xl font-bold text-slate-900">
        Drag PDF files here or click to browse
      </h2>
      <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-500">
        Upload a single document or select multiple PDFs. Each document keeps its
        own upload status and progress.
      </p>
      <div className="mx-auto mt-5 flex flex-wrap items-center justify-center gap-3 text-xs font-semibold text-slate-500">
        <span className="rounded-full bg-blue-50 px-3 py-1">Supported: PDF only</span>
        <span className="rounded-full bg-blue-50 px-3 py-1">Max size: 20 MB</span>
        <span className="rounded-full bg-blue-50 px-3 py-1">Up to 20 files</span>
      </div>
      <button
        type="button"
        className="primary-button mt-6"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
      >
        Choose PDF files
      </button>
    </section>
  );
}

export default UploadZone;
