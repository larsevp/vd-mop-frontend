import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Kravpakker API endpoints
export const getKravpakker = () => API.get("/kravpakker");
export const createKravpakker = (kravpakker) => API.post("/kravpakker", kravpakker);
export const updateKravpakker = (kravpakker) => API.put(`/kravpakker/${kravpakker.id}`, kravpakker);
export const deleteKravpakker = (id) => API.delete(`/kravpakker/${id}`);
export const getPaginatedKravpakker = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/kravpakker", page, pageSize, search, sortBy, sortOrder);
export const getKravpakkerById = (id) => API.get(`/kravpakker/${id}`);
export const getKravpakkerSimple = () => API.get("/kravpakker/simple");
