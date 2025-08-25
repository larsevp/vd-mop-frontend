import React from "react";
import { Route } from "react-router-dom";
import { AdminRoute } from "@/components/auth";
import { RowNew, RowEdit } from "@/components/tableComponents";
import Files from "@/pages/models/Files";

// Admin routes that will be included in the main Routes component
export const adminRoutes = (
  <Route element={<AdminRoute />}>
    <Route path="/files" element={<Files />} />
    <Route path="/files/ny" element={<RowNew />} />
    <Route path="/files/:id/rediger" element={<RowEdit />} />
  </Route>
);
