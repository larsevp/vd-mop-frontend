// Generated API endpoints for Krav
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

export const getKrav = () => API.get("/krav");
export const createKrav = (krav) => API.post("krav", krav);
export const updateKrav = (krav) => API.put(`krav/${krav.id}`, krav);
export const deleteKrav = (id) => API.delete(`krav/${id}`);
export const getPaginatedKrav = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/krav", page, pageSize, search, sortBy, sortOrder);
export const getKravById = (id) => API.get(`/krav/${id}`);
