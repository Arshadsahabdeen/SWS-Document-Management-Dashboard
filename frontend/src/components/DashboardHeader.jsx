import StatsCard from "./StatsCard.jsx";

function DashboardHeader({ title, subtitle, metrics, isLoading }) {
  return (
    <section className="dashboard-hero">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">
            Dashboard
          </p>
          <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <div className="text-sm font-semibold text-slate-500">
          Dashboard Overview
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="stat-card animate-pulse">
                <div className="h-3 w-20 rounded-full bg-blue-100" />
                <div className="mt-4 h-6 w-28 rounded-full bg-blue-100" />
                <div className="mt-3 h-3 w-24 rounded-full bg-blue-100" />
              </div>
            ))
          : metrics.map((metric) => (
              <StatsCard key={metric.label} {...metric} />
            ))}
      </div>
    </section>
  );
}

export default DashboardHeader;
