// Generated API endpoints for ProsjektKrav
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

// Field exclusion configuration for ProsjektKrav
const PROSJEKTKRAV_FIELD_EXCLUSION = {
  index: ["informasjon"], // Suppress heavy fields in list views
  edit: [], // Include all fields in edit views
  simple: ["beskrivelsePlain"],
};

// Select only fields to return from ProsjektKrav (used for multiselect)
const PROSJEKTKRAV_FIELD_FILTER = {
  index: ["id", "prosjektKravUID", "tittel", "parentId"], // Suppress heavy fields in list views
  edit: [], // Include all fields in edit views
};

// Helper to add field exclusion headers
const addProsjektKravFieldExclusion = (viewType, config = {}) => {
  const fieldsToExclude = PROSJEKTKRAV_FIELD_EXCLUSION[viewType] || [];
  if (fieldsToExclude.length === 0) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Exclude-Fields": fieldsToExclude.join(","),
    },
  };
};

// Adds only required fields to the multiselect thingy
const addProsjektKravFieldLimit = (viewType, config = {}) => {
  const fieldsToKeep = PROSJEKTKRAV_FIELD_FILTER[viewType] || [];
  if (fieldsToKeep.length === 0) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Only-Fields": fieldsToKeep.join(","),
    },
  };
};

export const getProsjektKrav = (config = {}) => {
  const updatedConfig = addProsjektKravFieldExclusion("index", config);
  return API.get("/prosjekt-krav", updatedConfig);
};

export const getProsjektKravSimple = () => API.get("/prosjekt-krav/simple", addProsjektKravFieldExclusion("simple"));

export const createProsjektKrav = (prosjektKravData) => API.post("prosjekt-krav", prosjektKravData);

export const updateProsjektKrav = (prosjektKravData) => API.put(`prosjekt-krav/${prosjektKravData.id}`, prosjektKravData);

export const updateProsjektKravMerknad = (prosjektKravId, merknader) => API.patch(`prosjekt-krav/${prosjektKravId}/merknad`, { merknader });

export const updateProsjektKravStatus = (prosjektKravId, statusId) => API.patch(`prosjekt-krav/${prosjektKravId}/status`, { statusId });

export const updateProsjektKravVurdering = (prosjektKravId, vurderingId) => API.patch(`prosjekt-krav/${prosjektKravId}/vurdering`, { vurderingId });

export const deleteProsjektKrav = (id) => API.delete(`prosjekt-krav/${id}`);

export const multiSelectProsjektKrav = (config = {}) => {
  const updatedConfig = addProsjektKravFieldLimit("index", config);
  return API.get("/prosjekt-krav", updatedConfig);
};

export const getPaginatedProsjektKrav = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const config = addProsjektKravFieldExclusion("index");
  return getPaginatedData("/prosjekt-krav", page, pageSize, search, sortBy, sortOrder, config);
};

export const getPaginatedProsjektKravAll = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  // No field exclusion - return all fields including "informasjon"
  return getPaginatedData("/prosjekt-krav", page, pageSize, search, sortBy, sortOrder);
};

export const getPaginatedProsjektKravGroupedByEmne = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const config = addProsjektKravFieldExclusion("index");
  return getPaginatedData("/prosjekt-krav/grouped-by-emne", page, pageSize, search, sortBy, sortOrder, config);
};

export const getProsjektKravById = (id, config = {}) => {
  const updatedConfig = addProsjektKravFieldExclusion("edit", config);
  return API.get(`/prosjekt-krav/${id}`, updatedConfig);
};