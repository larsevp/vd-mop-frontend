import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { AdminRoute } from "@/components/auth";
import { adminRoutes } from "./AdminRoutes";
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
import Kravreferansetype from "@/pages/models/KravreferanseType";
import Lov from "@/pages/models/Lov";
import Krav from "@/pages/models/Krav";
import Tiltak from "@/pages/models/Tiltak";
import ProsjektKrav from "@/pages/models/ProsjektKrav";
import ProsjektTiltak from "@/pages/models/ProsjektTiltak";
import Files from "@/pages/models/Files";
import NewKravWorkspace from "@/pages/KravTiltak/NewKravWorkspace";
import NewTiltakWorkspace from "@/pages/KravTiltak/NewTiltakWorkspace";
import ProsjektKravWorkspace from "@/pages/KravTiltak/prosjektkrav/ProsjektKravWorkspace";
import ProsjektTiltakWorkspace from "@/pages/KravTiltak/ProsjektTiltakWorkspace";
import ProsjektCombinedWorkspace from "@/pages/KravTiltak/ProsjektCombinedWorkspace";
import CombinedEntities from "@/pages/KravTiltak/CombinedEntities";

export default function AuthenticatedRoutes() {
  return (
    <Routes>
      {/* Protected routes with main layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/tiltakgenerell"
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
        <Route path="/prosjekt/:prosjektId" element={<ProjectLanding />} />
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
        <Route path="/kravreferansetyper" element={<Kravreferansetype />} />
        <Route path="/kravreferansetype/ny" element={<RowNew />} />
        <Route path="/kravreferansetype/:id/rediger" element={<RowEdit />} />
        <Route path="/lover" element={<Lov />} />
        <Route path="/lover/ny" element={<RowNew />} />
        <Route path="/lover/:id/rediger" element={<RowEdit />} />
        <Route path="/krav" element={<Krav />} />
        <Route path="/krav/ny" element={<RowNew />} />
        <Route path="/krav/:id/rediger" element={<RowEdit />} />
        <Route path="/tiltak" element={<Tiltak />} />
        <Route path="/tiltak/ny" element={<RowNew />} />
        <Route path="/tiltak/:id/rediger" element={<RowEdit />} />
        <Route path="/prosjekt-krav" element={<ProsjektKrav />} />
        <Route path="/prosjekt-krav/ny" element={<RowNew />} />
        <Route path="/prosjekt-krav/:id/rediger" element={<RowEdit />} />
        <Route path="/prosjekt-tiltak" element={<ProsjektTiltak />} />
        <Route path="/prosjekt-tiltak/ny" element={<RowNew />} />
        <Route path="/prosjekt-tiltak/:id/rediger" element={<RowEdit />} />
        <Route path="/krav-workspace" element={<NewKravWorkspace />} />
        <Route path="/krav-workspace/:entityId" element={<NewKravWorkspace />} />
        <Route path="/tiltak-workspace" element={<NewTiltakWorkspace />} />
        <Route path="/tiltak-workspace/:entityId" element={<NewTiltakWorkspace />} />
        <Route path="/combined-workspace" element={<CombinedEntities />} />
        <Route path="/combined-workspace/:entityId" element={<CombinedEntities />} />
        <Route path="/prosjekt-krav-workspace" element={<ProsjektKravWorkspace />} />
        <Route path="/prosjekt-krav-workspace/:entityId" element={<ProsjektKravWorkspace />} />
        <Route path="/prosjekt-tiltak-workspace" element={<ProsjektTiltakWorkspace />} />
        <Route path="/prosjekt-tiltak-workspace/:entityId" element={<ProsjektTiltakWorkspace />} />
        <Route path="/prosjekt-combined-workspace" element={<ProsjektCombinedWorkspace />} />
        <Route path="/prosjekt-combined-workspace/:entityId" element={<ProsjektCombinedWorkspace />} />
        {/* Admin routes */}
        {adminRoutes}
        {/* Redirect any other route (including /login) to home when authenticated */}
        <Route path="*" element={<LandingPage />} />
      </Route>
    </Routes>
  );
}
