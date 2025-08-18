import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Emne API endpoints
export const getEmner = () => API.get("/emne");
export const createEmne = (emne) => API.post("/emne", emne);
export const updateEmne = (emne) => API.put(`/emne/${emne.id}`, emne);
export const deleteEmne = (id) => API.delete(`/emne/${id}`);
export const getPaginatedEmne = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/emne", page, pageSize, search, sortBy, sortOrder);
export const getEmneById = (id) => API.get(`/emne/${id}`);
