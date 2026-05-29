function ProgressBar({ value = 0 }) {
  const safeValue = Math.min(100, Math.max(0, Math.round(value)));

  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Progress</span>
        <span>{safeValue}%</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-brand-600 transition-all duration-300 ease-out"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
