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
      className={`dashboard-card border-2 border-dashed p-8 text-center transition ${
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
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-base font-bold text-brand-700 ring-1 ring-blue-100">
        PDF
      </div>
      <h2 className="mt-5 text-xl font-bold text-slate-900">
        Drop PDF files here
      </h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
        Upload a single document or select multiple PDFs. Each document keeps
        its own upload status and progress.
      </p>
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
