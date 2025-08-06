import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TiltaksoversiktGenerelle from './pages/TiltaksoversiktGenerelle';
import TiltaksoversiktProsjekt from './pages/TiltaksoversiktProsjekt';
import Brukeradministrasjon from './pages/Brukeradministrasjon';
import RowNew from './components/RowNew';
import RowEdit from './components/RowEdit';
import Prosjektadministrasjon from './pages/Prosjektadministrasjon';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';

export default function AppRouter() {
  return (
    <Routes>
      {/* Public route */}
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes with main layout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/tiltak" element={<div className="pb-20 max-w-screen-xl mx-auto"><TiltaksoversiktGenerelle /></div>} />
          <Route path="/tiltak-prosjekt" element={<div className="pb-20 max-w-screen-xl mx-auto"><TiltaksoversiktProsjekt /></div>} />
          <Route path="/admin" element={<Brukeradministrasjon />} />
          <Route path="/admin/ny" element={<RowNew />} />
          <Route path="/admin/:id/rediger" element={<RowEdit />} />
          <Route path="/prosjekter" element={<Prosjektadministrasjon />} />
          <Route path="/prosjekter/ny" element={<RowNew />} />
          <Route path="/prosjekter/:id/rediger" element={<RowEdit />} />
        </Route>
      </Route>
    </Routes>
  );
}
