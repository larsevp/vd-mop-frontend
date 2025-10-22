// Generated API endpoints for Tiltak
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

// Field exclusion configuration for Tiltak
const TILTAK_FIELD_EXCLUSION = {
  index: ["beskrivelse", "implementasjon", "tilbakemelding"], // Suppress heavy fields in list views
  edit: [], // Include all fields in edit views
};

// Select only fields to return from Tiltak (used for multiselect)
const TILTAK_FIELD_FILTER = {
  index: ["id", "tiltakUID", "tittel", "parentId"], // Essential fields for multiselect
  edit: [], // Include all fields in edit views
};

// Helper to add field exclusion headers
const addTiltakFieldExclusion = (viewType, config = {}) => {
  const fieldsToExclude = TILTAK_FIELD_EXCLUSION[viewType] || [];
  if (fieldsToExclude.length === 0) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Exclude-Fields": fieldsToExclude.join(","),
    },
  };
};

// Adds only required fields for multiselect
const addTiltakFieldLimit = (viewType, config = {}) => {
  const fieldsToKeep = TILTAK_FIELD_FILTER[viewType] || [];
  if (fieldsToKeep.length === 0) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Only-Fields": fieldsToKeep.join(","),
    },
  };
};

// Basic CRUD operations
export const getTiltak = (config = {}) => {
  const updatedConfig = addTiltakFieldExclusion("index", config);
  return API.get("/tiltak", updatedConfig);
};

export const getTiltakSimple = () => API.get("/tiltak/simple");

export const getTiltakById = (id, config = {}) => {
  const updatedConfig = addTiltakFieldExclusion("edit", config);
  return API.get(`/tiltak/${id}`, updatedConfig);
};

export const createTiltak = (tiltakData) => {
  // Strip auto-generated fields that should only be set by backend
  const { tiltakUID, id, createdAt, updatedAt, createdBy, updatedBy, ...cleanData } = tiltakData;
  return API.post("/tiltak", cleanData);
};

export const updateTiltak = (id, tiltakData) => API.put(`/tiltak/${id}`, tiltakData);

export const deleteTiltak = (id) => API.delete(`/tiltak/${id}`);

// Multiselect endpoint
export const multiSelectTiltak = (config = {}) => {
  const updatedConfig = addTiltakFieldLimit("index", config);
  return API.get("/tiltak", updatedConfig);
};

// Pagination endpoints
export const getPaginatedTiltak = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const config = addTiltakFieldExclusion("index");
  return getPaginatedData("/tiltak", page, pageSize, search, sortBy, sortOrder, config);
};

export const getPaginatedTiltakAll = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  // No field exclusion - return all fields including heavy content
  return getPaginatedData("/tiltak", page, pageSize, search, sortBy, sortOrder);
};

export const getPaginatedTiltakGroupedByEmne = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const config = addTiltakFieldExclusion("index");
  return getPaginatedData("/tiltak/grouped-by-emne", page, pageSize, search, sortBy, sortOrder, config);
};

// Relationship management - Tiltak-Krav
export const addKravToTiltak = (tiltakId, kravIds) => {
  return API.post(`/tiltak/${tiltakId}/krav`, { kravIds });
};

export const removeKravFromTiltak = (tiltakId, kravIds) => {
  return API.delete(`/tiltak/${tiltakId}/krav`, { data: { kravIds } });
};

// Relationship management - Tiltak-ProsjektKrav
export const addProsjektKravToTiltak = (tiltakId, prosjektKravIds) => {
  return API.post(`/tiltak/${tiltakId}/prosjekt-krav`, { prosjektKravIds });
};

export const removeProsjektKravFromTiltak = (tiltakId, prosjektKravIds) => {
  return API.delete(`/tiltak/${tiltakId}/prosjekt-krav`, { data: { prosjektKravIds } });
};

// Specific field update endpoints for better UX
export const updateTiltakStatus = (id, statusId) => {
  return API.patch(`/tiltak/${id}/status`, { statusId });
};

export const updateTiltakVurdering = (id, vurderingId) => {
  return API.patch(`/tiltak/${id}/vurdering`, { vurderingId });
};

export const updateTiltakMerknad = (id, merknad) => {
  return API.patch(`/tiltak/${id}/merknad`, { merknad });
};
