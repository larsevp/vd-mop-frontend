import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import LandingPage from "@/pages/landing/LandingPage";
import TiltaksoversiktGenerelle from "@/pages/TiltaksoversiktGenerelle";
import TiltaksoversiktProsjekt from "@/pages/TiltaksoversiktProsjekt";
import Brukeradministrasjon from "@/pages/models/Brukeradministrasjon";
import { RowNew, RowEdit } from "@/components/tableComponents";
import Prosjektadministrasjon from "@/pages/models/Prosjektadministrasjon";
import ProjectLanding from "@/pages/landing/ProjectLanding";
import Enhetsadministrasjon from "@/pages/models/Enhetsadministrasjon";
import Emneadministrasjon from "@/pages/models/Emneadministrasjon";
import Vurderingadministrasjon from "@/pages/models/Vurderingadministrasjon";
import Statusadministrasjon from "@/pages/models/Statusadministrasjon";
import Kravpakkeradministrasjon from "@/pages/models/Kravpakker";
import AdminLanding from "@/pages/landing/AdminLanding";

export default function AuthenticatedRoutes() {
  return (
    <Routes>
      {/* Protected routes with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/tiltak"
          element={
            <div className="pb-20 max-w-screen-xl mx-auto">
              <TiltaksoversiktGenerelle />
            </div>
          }
        />
        <Route
          path="/tiltak-prosjekt"
          element={
            <div className="pb-20 max-w-screen-xl mx-auto">
              <TiltaksoversiktProsjekt />
            </div>
          }
        />
        <Route path="/admin" element={<Brukeradministrasjon />} />
        <Route path="/project-landing" element={<ProjectLanding />} />
        <Route path="/admin-landing" element={<AdminLanding />} />
        <Route path="/admin/ny" element={<RowNew />} />
        <Route path="/admin/:id/rediger" element={<RowEdit />} />
        <Route path="/prosjekter" element={<Prosjektadministrasjon />} />
        <Route path="/prosjekter/ny" element={<RowNew />} />
        <Route path="/prosjekter/:id/rediger" element={<RowEdit />} />
        <Route path="/enheter" element={<Enhetsadministrasjon />} />
        <Route path="/enheter/ny" element={<RowNew />} />
        <Route path="/enheter/:id/rediger" element={<RowEdit />} />
        <Route path="/emner" element={<Emneadministrasjon />} />
        <Route path="/emner/ny" element={<RowNew />} />
        <Route path="/emner/:id/rediger" element={<RowEdit />} />
        <Route path="/status" element={<Statusadministrasjon />} />
        <Route path="/status/ny" element={<RowNew />} />
        <Route path="/status/:id/rediger" element={<RowEdit />} />
        <Route path="/vurderinger" element={<Vurderingadministrasjon />} />
        <Route path="/vurdering/ny" element={<RowNew />} />
        <Route path="/vurdering/:id/rediger" element={<RowEdit />} />
        <Route path="/kravpakker" element={<Kravpakkeradministrasjon />} />
        <Route path="/kravpakker/ny" element={<RowNew />} />
        <Route path="/kravpakker/:id/rediger" element={<RowEdit />} />
        {/* Redirect any other route (including /login) to home when authenticated */}
        <Route path="*" element={<LandingPage />} />
      </Route>
    </Routes>
  );
}
