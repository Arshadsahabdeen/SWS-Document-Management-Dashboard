const accentStyles = {
  blue: "bg-blue-50 text-brand-700 ring-blue-100",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100"
};

function StatsCard({ label, value, helper, accent = "blue", icon }) {
  const accentClass = accentStyles[accent] || accentStyles.blue;

  return (
    <div className="stat-card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-950">{value}</p>
          {helper ? (
            <p className="mt-1 text-xs font-medium text-slate-500">{helper}</p>
          ) : null}
        </div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${accentClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default StatsCard;
