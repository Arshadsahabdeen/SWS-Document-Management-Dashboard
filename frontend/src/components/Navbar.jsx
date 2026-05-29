import { NavLink } from "react-router-dom";

const links = [
  { to: "/", label: "Upload" },
  { to: "/documents", label: "Documents" },
  { to: "/notifications", label: "Notifications", showBadge: true }
];

function Navbar({ unreadCount = 0 }) {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-blue-100 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <NavLink to="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-sm font-bold text-white shadow-sm">
            DD
          </span>
          <span className="text-lg font-bold text-slate-950">
            Document Dashboard
          </span>
        </NavLink>
        <div className="flex items-center gap-1 rounded-2xl bg-blue-50 p-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `relative rounded-xl px-3 py-2 text-sm font-semibold transition sm:px-4 ${
                  isActive
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-slate-600 hover:text-brand-700"
                }`
              }
            >
              <span>{link.label}</span>
              {link.showBadge && unreadCount > 0 && (
                <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold leading-none text-white">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}

export default Navbar;
