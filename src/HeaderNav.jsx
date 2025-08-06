import React from 'react';
import { List, Briefcase, Home, ArrowLeft } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useMsal } from '@azure/msal-react';
import { useUserStore } from './stores/store';

export default function HeaderNav({ showBackButton = false }) {
  const name = useUserStore(state => state.name);
  const location = useLocation();
  const navigate = useNavigate();
  const { accounts } = useMsal();
  const [tenantError] = React.useState(false);

  const navItems = [
    { path: '/tiltak', label: 'Generelle tiltak', icon: <List size={16} /> },
    { path: '/tiltak-prosjekt', label: 'Prosjekttiltak', icon: <Briefcase size={16} /> },
  ];

  if (tenantError) {
    return (
      <header className="bg-white border-b border-red-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-2">
              <span className="text-red-600 font-semibold">Du har ikke tilgang til denne applikasjonen (feil tenant).</span>
            </div>
          </div>
        </div>
      </header>
    );
  }
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-20 shadow-sm">
      <div className="max-w-screen-xl mx-auto">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <button
                onClick={() => navigate(-1)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
                aria-label="Gå tilbake"
              >
                <ArrowLeft size={18} />
              </button>
            ) : null}
            <Link to="/" className="flex items-center gap-2">
              <Home size={20} className="text-blue-500" />
              <span className="font-semibold text-lg text-neutral-900">MOP</span>
            </Link>
          </div>
          {/* Push nav and user info to the right */}
          <div className="flex-1 flex items-center justify-end gap-4">
            <nav className="hidden md:flex">
              <ul className="flex gap-1">
                {navItems.map(item => (
                  <li key={item.path}>
                    <Link 
                      to={item.path}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        location.pathname === item.path 
                          ? 'bg-blue-50 text-blue-700' 
                          : 'text-neutral-700 hover:bg-neutral-100'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            {/* Show user name and logout button if logged in */}
            {accounts && accounts.length > 0 && (
              <div className="flex items-center gap-2 ml-4">
                {name && <span className="text-neutral-700 font-medium">{name}</span>}
                {/* LogoutButton will be rendered in App */}
              </div>
            )}
          </div>
        </div>
        {/* Mobile navigation */}
        <div className="md:hidden border-t border-neutral-200">
          <div className="grid grid-cols-2">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-blue-50 text-blue-700 border-t-2 border-blue-500' 
                    : 'text-neutral-700 hover:bg-neutral-50'
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
