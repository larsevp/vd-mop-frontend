import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Vurdering API endpoints
export const getVurderinger = () => API.get("/vurdering");
export const createVurdering = (vurdering) => API.post("/vurdering", vurdering);
export const updateVurdering = (vurdering) => API.put(`/vurdering/${vurdering.id}`, vurdering);
export const deleteVurdering = (id) => API.delete(`/vurdering/${id}`);
export const getPaginatedVurdering = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/vurdering", page, pageSize, search, sortBy, sortOrder);
export const getVurderingById = (id) => API.get(`/vurdering/${id}`);
