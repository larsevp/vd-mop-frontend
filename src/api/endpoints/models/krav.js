// Generated API endpoints for Krav
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

// Field exclusion configuration for Krav
const KRAV_FIELD_EXCLUSION = {
  index: ["informasjon"], // Suppress heavy fields in list views
  edit: [], // Include all fields in edit views
  simple: ["beskrivelsePlain"],
  //beskrivelsePlain
};
// Select only fields to return from Krav (used for multiselect) || utgår faktisk,- begynner med simple things instead
const KRAV_FIELD_FILTER = {
  index: ["id", "kravUID", "tittel", "parentId"], // Suppress heavy fields in list views
  edit: [], // Include all fields in edit views
};

// Helper to add field exclusion headers
const addKravFieldExclusion = (viewType, config = {}) => {
  const fieldsToExclude = KRAV_FIELD_EXCLUSION[viewType] || [];
  if (fieldsToExclude.length === 0) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Exclude-Fields": fieldsToExclude.join(","),
    },
  };
};
//Adds only required fields to the multiselect thingy
const addKravFieldLimit = (viewType, config = {}) => {
  const fieldsToKeep = KRAV_FIELD_FILTER[viewType] || [];
  if (fieldsToKeep.length === 0) return config;

  return {
    ...config,
    headers: {
      ...config.headers,
      "X-Only-Fields": fieldsToKeep.join(","),
    },
  };
};
//X-Only-Fields
export const getKrav = (config = {}) => {
  const updatedConfig = addKravFieldExclusion("index", config);
  return API.get("/krav", updatedConfig);
};
export const getKravSimple = () => API.get("/krav/simple", addKravFieldExclusion("simple"));
export const createKrav = (kravData) => API.post("krav", kravData);

export const updateKrav = (id, kravData) => API.put(`krav/${id}`, kravData);

export const updateKravMerknad = (kravId, merknader) => API.patch(`krav/${kravId}/merknad`, { merknader });

export const updateKravStatus = (kravId, statusId) => API.patch(`krav/${kravId}/status`, { statusId });

export const updateKravVurdering = (kravId, vurderingId) => API.patch(`krav/${kravId}/vurdering`, { vurderingId });

export const deleteKrav = (id) => API.delete(`krav/${id}`);

export const multiSelectKrav = (config = {}) => {
  const updatedConfig = addKravFieldLimit("index", config);
  return API.get("/krav", updatedConfig);
};

export const getPaginatedKrav = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const config = addKravFieldExclusion("index");
  return getPaginatedData("/krav", page, pageSize, search, sortBy, sortOrder, config);
};

export const getPaginatedKravAll = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  // No field exclusion - return all fields including "informasjon"
  return getPaginatedData("/krav", page, pageSize, search, sortBy, sortOrder);
};

export const getPaginatedKravGroupedByEmne = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const config = addKravFieldExclusion("index");
  return getPaginatedData("/krav/grouped-by-emne", page, pageSize, search, sortBy, sortOrder, config);
};

export const getKravById = (id, config = {}) => {
  const updatedConfig = addKravFieldExclusion("edit", config);
  return API.get(`/krav/${id}`, updatedConfig);
};
