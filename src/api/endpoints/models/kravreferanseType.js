import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// KravreferanseType API endpoints
export const getKravreferanseTyper = () => API.get("/kravreferansetype");
export const createKravreferanseType = (kravreferansetype) => API.post("/kravreferansetype", kravreferansetype);
export const updateKravreferanseType = (kravreferansetype) => API.put(`/kravreferansetype/${kravreferansetype.id}`, kravreferansetype);
export const deleteKravreferanseType = (id) => API.delete(`/kravreferansetype/${id}`);
export const getPaginatedKravreferanseType = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/kravreferansetype", page, pageSize, search, sortBy, sortOrder);
export const getKravreferanseTypeById = (id) => API.get(`/kravreferansetype/${id}`);
