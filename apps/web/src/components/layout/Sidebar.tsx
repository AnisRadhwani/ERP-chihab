import { NavLink } from "react-router-dom";
import { navItems } from "../../app/navigation";

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col bg-sidebar text-white">
      <div className="flex h-16 items-center border-b border-white/10 px-6">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-blue-400">
            Ecom ERP
          </p>
          <h1 className="text-lg font-semibold">Profit Tracker</h1>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              [
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-active text-white"
                  : "text-slate-300 hover:bg-sidebar-hover hover:text-white",
              ].join(" ")
            }
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <p className="text-xs text-slate-400">Version 1.0 — MVP</p>
      </div>
    </aside>
  );
}
