import React from "react";
import { List, Briefcase, Home, ArrowLeft, Users } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMsal } from "@azure/msal-react";
import { useUserStore } from "@/stores/userStore";
import { UserProjectMenu } from "./UserProjectMenu";

export default function HeaderNav({ showBackButton = false }) {
  const user = useUserStore((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const [tenantError] = React.useState(false);
  const isAdmin = user?.rolle === "ADMIN";

  const navItems = [
    { path: "/tiltak", label: "Generelle tiltak", icon: <List size={16} /> },
    { path: "/tiltak-prosjekt", label: "Prosjekttiltak", icon: <Briefcase size={16} /> },
  ];

  if (tenantError) {
    return (
      <header className="bg-background-primary border-b border-error-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="text-error-600 font-semibold">Du har ikke tilgang til denne applikasjonen (feil tenant).</span>
            </div>
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className="bg-background-primary border-b border-border-muted sticky top-0 z-20 shadow-sm">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button
                onClick={() => navigate(-1)}
                className="p-1 rounded-full hover:bg-background-muted text-text-muted"
                aria-label="Gå tilbake"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <Link to="/" className="flex items-center gap-2">
              <Home size={20} className="text-primary-500" />
              <span className="font-semibold text-lg text-text-primary">MOP</span>
            </Link>
          </div>
          {/* Push nav and user info to the right */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <nav className="hidden md:flex">
              <ul className="flex gap-1">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === item.path ? "bg-primary-50 text-primary-700" : "text-text-secondary hover:bg-background-muted"
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                ))}
                {isAdmin && (
                  <>
                    <li>
                      <Link
                        to="/admin-landing"
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors text-text-secondary hover:bg-background-muted"
                      >
                        <List size={16}></List>
                        <span>Admin</span>
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </nav>
            {/* Modern User & Project Menu */}
            {(user || (accounts && accounts.length > 0)) && (
              <UserProjectMenu />
            )}
          </div>
        </div>
        {/* Mobile navigation */}
        <div className="md:hidden border-t border-border-muted">
          <div className="grid grid-cols-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  location.pathname === item.path
                    ? "bg-primary-50 text-primary-700 border-t-2 border-primary-500"
                    : "text-text-secondary hover:bg-background-muted"
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
