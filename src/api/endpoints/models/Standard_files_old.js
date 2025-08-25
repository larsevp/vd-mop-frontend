// Generated API endpoints for Files
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

export const getFileser = () => API.get("/files");
export const createFiles = (files) => API.post("files", files);
export const updateFiles = (files) => API.put(`files/${files.id}`, files);
export const deleteFiles = (id) => API.delete(`files/${id}`);
export const getPaginatedFiles = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/files", page, pageSize, search, sortBy, sortOrder);
export const getFilesById = (id) => API.get(`/files/${id}`);
