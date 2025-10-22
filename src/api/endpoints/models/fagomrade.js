import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Fagomrade API endpoints
export const getFagomrader = () => API.get("/fagomrade");
export const createFagomrade = (fagomrade) => API.post("/fagomrade", fagomrade);
export const updateFagomrade = (fagomrade) => API.put(`/fagomrade/${fagomrade.id}`, fagomrade);
export const deleteFagomrade = (id) => API.delete(`/fagomrade/${id}`);
export const getPaginatedFagomrade = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/fagomrade", page, pageSize, search, sortBy, sortOrder);
export const getFagomradeById = (id) => API.get(`/fagomrade/${id}`);
export const getFagomraderSimple = () => API.get("/fagomrade/simple");