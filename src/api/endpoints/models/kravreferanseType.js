// Generated API endpoints for KravreferanseType
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

export const getKravreferanseTyper = () => API.get("/kravreferanse-type");
export const createKravreferanseType = (kravreferansetype) => API.post("kravreferanse-type", kravreferansetype);
export const updateKravreferanseType = (kravreferansetype) => API.put(`kravreferanse-type/${kravreferansetype.id}`, kravreferansetype);
export const deleteKravreferanseType = (id) => API.delete(`kravreferanse-type/${id}`);
export const getPaginatedKravreferanseType = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/kravreferanse-type", page, pageSize, search, sortBy, sortOrder);
export const getKravreferanseTypeById = (id) => API.get(`/kravreferanse-type/${id}`);
