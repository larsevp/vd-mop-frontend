// Generated API endpoints for Files
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

// Field exclusion configuration for Files
const FILES_FIELD_EXCLUSION = {
  index: [], // Include all fields in list views for files
  edit: [], // Include all fields in edit views
};

// Helper to add field exclusion headers
const addFilesFieldExclusion = (viewType, config = {}) => {
  const fieldsToExclude = FILES_FIELD_EXCLUSION[viewType] || [];
  if (fieldsToExclude.length === 0) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Exclude-Fields": fieldsToExclude.join(","),
    },
  };
};

// Standard CRUD operations
export const getFiles = (config = {}) => {
  const updatedConfig = addFilesFieldExclusion("index", config);
  return API.get("/files", updatedConfig);
};

export const createFile = (fileData) => API.post("files", fileData);

export const updateFile = (fileData) => API.put(`files/${fileData.id}`, fileData);

export const deleteFile = (id) => API.delete(`files/${id}`);

export const deleteFileWithCleanup = (id) => API.delete(`files/${id}/cleanup`);

export const getPaginatedFiles = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const config = addFilesFieldExclusion("index");
  return getPaginatedData("/files", page, pageSize, search, sortBy, sortOrder, config);
};

export const getFileById = (id, config = {}) => {
  const updatedConfig = addFilesFieldExclusion("edit", config);
  return API.get(`/files/${id}`, updatedConfig);
};

// Scoped queries for file relationships
export const getFilesByModel = (modelType, modelId, config = {}) => {
  const updatedConfig = addFilesFieldExclusion("index", config);
  return API.get(`/files/model/${modelType}/${modelId}`, updatedConfig);
};

export const getFilesByUser = (userId, config = {}) => {
  const updatedConfig = addFilesFieldExclusion("index", config);
  return API.get(`/files/user/${userId}`, updatedConfig);
};

export const getFilesByEnhet = (enhetId, config = {}) => {
  const updatedConfig = addFilesFieldExclusion("index", config);
  return API.get(`/files/enhet/${enhetId}`, updatedConfig);
};

// File upload operations
export const uploadFile = (formData, config = {}) => {
  return API.post("/files/upload", formData, {
    ...config,
    headers: {
      "Content-Type": "multipart/form-data",
      ...config.headers,
    },
  });
};

// Image resizing endpoint
export const uploadImage = (formData, maxWidth = 1500, config = {}) => {
  return API.post(`/files/upload/image?maxWidth=${maxWidth}`, formData, {
    ...config,
    headers: {
      "Content-Type": "multipart/form-data",
      ...config.headers,
    },
  });
};

// Generate signed URL for private file access
export const getFileSignedUrl = (id, config = {}) => {
  return API.get(`/files/${id}/signed-url`, config);
};

// Get thumbnail URL for a file
export const getFileThumbnail = (id, config = {}) => {
  return API.get(`/files/${id}/thumbnail`, config);
};

// Simple list for dropdowns
export const getSimpleFiles = (config = {}) => {
  return API.get("/files/simple", config);
};
