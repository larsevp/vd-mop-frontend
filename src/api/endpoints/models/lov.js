// Generated API endpoints for Lov
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

export const getLover = () => API.get("/lov");
export const createLov = (lov) => API.post("lov", lov);
export const updateLov = (lov) => API.put(`lov/${lov.id}`, lov);
export const deleteLov = (id) => API.delete(`lov/${id}`);
export const getPaginatedLov = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/lov", page, pageSize, search, sortBy, sortOrder);
export const getLovById = (id) => API.get(`/lov/${id}`);
