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

export const createProsjektKrav = async (prosjektKravData) => {
  // Get current project from store
  const { useProjectStore } = await import("@/stores/userStore");
  const { currentProject } = useProjectStore.getState();
  const projectId = currentProject?.id;
  
  if (!projectId || isNaN(Number(projectId))) {
    throw new Error('Ingen gyldig prosjekt valgt. Vennligst velg et prosjekt før du oppretter krav.');
  }
  
  // Include projectId in the data
  const dataWithProjectId = {
    ...prosjektKravData,
    projectId: Number(projectId)
  };
  
  return API.post("prosjekt-krav", dataWithProjectId);
};

export const updateProsjektKrav = (prosjektKravData) => API.put(`prosjekt-krav/${prosjektKravData.id}`, prosjektKravData);

export const updateProsjektKravMerknad = (prosjektKravId, merknader) => API.patch(`prosjekt-krav/${prosjektKravId}/merknad`, { merknader });

export const updateProsjektKravStatus = (prosjektKravId, statusId) => API.patch(`prosjekt-krav/${prosjektKravId}/status`, { statusId });

export const updateProsjektKravVurdering = (prosjektKravId, vurderingId) => API.patch(`prosjekt-krav/${prosjektKravId}/vurdering`, { vurderingId });

export const deleteProsjektKrav = (id) => API.delete(`prosjekt-krav/${id}`);

export const multiSelectProsjektKrav = (config = {}) => {
  const updatedConfig = addProsjektKravFieldLimit("index", config);
  return API.get("/prosjekt-krav", updatedConfig);
};

export const getPaginatedProsjektKrav = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc", projectId = null) => {
  const config = addProsjektKravFieldExclusion("index");
  
  // Build params including projectId
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(projectId && { projectId: projectId.toString() }),
  });

  // Call the endpoint directly since we're building custom params
  return API.get(`/prosjekt-krav/paginated?${params}`, config);
};

export const getPaginatedProsjektKravAll = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc", projectId = null) => {
  // No field exclusion - return all fields including "informasjon"
  
  // Build params including projectId
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(projectId && { projectId: projectId.toString() }),
  });

  // Call the endpoint directly since we're building custom params
  return API.get(`/prosjekt-krav/paginated?${params}`);
};

export const getPaginatedProsjektKravGroupedByEmne = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc", projectId = null) => {
  const config = addProsjektKravFieldExclusion("index");
  
  // Build params including projectId
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(projectId && { projectId: projectId.toString() }),
  });

  // Call the endpoint directly since we're building custom params
  return API.get(`/prosjekt-krav/grouped-by-emne/paginated?${params}`, config);
};

export const getProsjektKravById = (id, config = {}) => {
  const updatedConfig = addProsjektKravFieldExclusion("edit", config);
  return API.get(`/prosjekt-krav/${id}`, updatedConfig);
};