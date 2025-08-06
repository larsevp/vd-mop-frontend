import React from 'react';
import { NavLink } from 'react-router-dom';


const navItems = [
  { label: 'Hjem', to: '/' },
  { label: 'Prosjektliste', to: '/prosjekter' },
  { label: 'Tiltaksoversikt', to: '/tiltak', current: true },
  { label: 'Kravsliste', to: '/krav' },
  { label: 'Temaliste', to: '/tema' },
];

export default function HeaderNav() {
  return (
    <nav className="flex gap-8 py-5 px-8 border-b bg-white text-gray-800 shadow-sm items-center sticky top-0 z-10">
      {navItems.map((item) => (
        <NavLink
          key={item.label}
          to={item.to}
          className={({ isActive }) =>
            `text-base font-semibold px-2 py-1 rounded transition-all duration-150
            ${isActive || item.current ? 'bg-green-100 text-green-700 shadow font-bold underline underline-offset-4' : 'hover:bg-gray-100 hover:text-green-700'}`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
