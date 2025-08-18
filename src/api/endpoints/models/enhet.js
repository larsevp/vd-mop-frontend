import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Enhet API endpoints
export const getEnheter = () => API.get("/enhet");
export const createEnhet = (enhet) => API.post("/enhet", enhet);
export const updateEnhet = (enhet) => API.put(`/enhet/${enhet.id}`, enhet);
export const deleteEnhet = (id) => API.delete(`/enhet/${id}`);
export const getPaginatedEnhet = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/enhet", page, pageSize, search, sortBy, sortOrder);
export const getEnhetById = (id) => API.get(`/enhet/${id}`);

// Special endpoint for enhet
export const getPotentialParents = (level) => API.get(`/enhet/potential-parents/${level}`);
