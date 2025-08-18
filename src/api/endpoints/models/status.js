import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Status API endpoints
export const getStatus = () => API.get("/status");
export const createStatus = (status) => API.post("/status", status);
export const updateStatus = (status) => API.put(`/status/${status.id}`, status);
export const deleteStatus = (id) => API.delete(`/status/${id}`);
export const getPaginatedStatus = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/status", page, pageSize, search, sortBy, sortOrder);
export const getStatusById = (id) => API.get(`/status/${id}`);
