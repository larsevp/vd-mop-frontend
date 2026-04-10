import React from "react";
import { Outlet } from "react-router-dom";
import HeaderNav from "./HeaderNav";
import ScrollToTop from "../../ScrollToTop";

export default function MainLayout() {
  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ScrollToTop />
      <HeaderNav />
      {/*
        Remaining vertical space.
        - Pages that fit exactly (workspace) should use `h-full` + internal scroll.
        - Pages that need outer scroll should let this wrapper scroll them.
      */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
