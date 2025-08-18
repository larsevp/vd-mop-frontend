import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Prosjekt API endpoints
export const getProsjekter = () => API.get("/prosjekt");
export const createProsjekt = (data) => API.post("/prosjekt", data);
export const updateProsjekt = (prosjekt) => API.put(`/prosjekt/${prosjekt.id}`, prosjekt);
export const deleteProsjekt = (id) => API.delete(`/prosjekt/${id}`);
export const getPaginatedProsjekt = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/prosjekt", page, pageSize, search, sortBy, sortOrder);
export const getProsjektById = (id) => API.get(`/prosjekt/${id}`);
