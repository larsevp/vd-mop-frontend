// Generated API endpoints for ProsjektTiltak
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";

// Field exclusion configuration for ProsjektTiltak
const PROSJEKTTILTAK_FIELD_EXCLUSION = {
  index: ["beskrivelse", "implementasjon", "tilbakemelding"], // Suppress heavy fields in list views
  edit: [], // Include all fields in edit views
};

// Select only fields to return from ProsjektTiltak (used for multiselect)
const PROSJEKTTILTAK_FIELD_FILTER = {
  index: ["id", "prosjektTiltakUID", "tittel", "parentId"], // Essential fields for multiselect
  edit: [], // Include all fields in edit views
};

// Helper to add field exclusion headers
const addProsjektTiltakFieldExclusion = (viewType, config = {}) => {
  const fieldsToExclude = PROSJEKTTILTAK_FIELD_EXCLUSION[viewType] || [];
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
const addProsjektTiltakFieldLimit = (viewType, config = {}) => {
  const fieldsToKeep = PROSJEKTTILTAK_FIELD_FILTER[viewType] || [];
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
export const getProsjektTiltak = (config = {}) => {
  const updatedConfig = addProsjektTiltakFieldExclusion("index", config);
  return API.get("/prosjekt-tiltak", updatedConfig);
};

export const getProsjektTiltakSimple = () => API.get("/prosjekt-tiltak/simple");

export const getProsjektTiltakById = (id, config = {}) => {
  const updatedConfig = addProsjektTiltakFieldExclusion("edit", config);
  return API.get(`/prosjekt-tiltak/${id}`, updatedConfig);
};

export const createProsjektTiltak = async (prosjektTiltakData) => {
  // Get current project from store
  const { useProjectStore } = await import("@/stores/userStore");
  const { currentProject } = useProjectStore.getState();
  const projectId = currentProject?.id;

  if (!projectId || isNaN(Number(projectId))) {
    throw new Error("Ingen gyldig prosjekt valgt. Vennligst velg et prosjekt før du oppretter tiltak.");
  }

  // Include projectId in the data
  const dataWithProjectId = {
    ...prosjektTiltakData,
    projectId: Number(projectId),
  };

  return API.post("/prosjekt-tiltak", dataWithProjectId);
};

export const updateProsjektTiltak = (id, prosjektTiltakData) => API.put(`/prosjekt-tiltak/${id}`, prosjektTiltakData);

export const deleteProsjektTiltak = (id) => API.delete(`/prosjekt-tiltak/${id}`);

// Multiselect endpoint
export const multiSelectProsjektTiltak = (config = {}) => {
  const updatedConfig = addProsjektTiltakFieldLimit("index", config);
  return API.get("/prosjekt-tiltak", updatedConfig);
};

// Pagination endpoints
export const getPaginatedProsjektTiltak = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc", projectId = null) => {
  const config = addProsjektTiltakFieldExclusion("index");

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
  return API.get(`/prosjekt-tiltak/paginated?${params}`, config);
};

export const getPaginatedProsjektTiltakAll = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc", projectId = null) => {
  // No field exclusion - return all fields including heavy content

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
  return API.get(`/prosjekt-tiltak/paginated?${params}`);
};

export const getPaginatedProsjektTiltakGroupedByEmne = (
  page = 1,
  pageSize = 10,
  search = "",
  sortBy = "",
  sortOrder = "asc",
  projectId = null
) => {
  const config = addProsjektTiltakFieldExclusion("index");

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
  return API.get(`/prosjekt-tiltak/grouped-by-emne/paginated?${params}`, config);
};

// Relationship management - ProsjektTiltak-Krav
export const addKravToProsjektTiltak = (prosjektTiltakId, kravIds) => {
  return API.post(`/prosjekt-tiltak/${prosjektTiltakId}/krav`, { kravIds });
};

export const removeKravFromProsjektTiltak = (prosjektTiltakId, kravIds) => {
  return API.delete(`/prosjekt-tiltak/${prosjektTiltakId}/krav`, { data: { kravIds } });
};

// Relationship management - ProsjektTiltak-ProsjektKrav
export const addProsjektKravToProsjektTiltak = (prosjektTiltakId, prosjektKravIds) => {
  return API.post(`/prosjekt-tiltak/${prosjektTiltakId}/prosjekt-krav`, { prosjektKravIds });
};

export const removeProsjektKravFromProsjektTiltak = (prosjektTiltakId, prosjektKravIds) => {
  return API.delete(`/prosjekt-tiltak/${prosjektTiltakId}/prosjekt-krav`, { data: { prosjektKravIds } });
};

// Specific field update endpoints for better UX
export const updateProsjektTiltakStatus = (id, statusId) => {
  return API.patch(`/prosjekt-tiltak/${id}/status`, { statusId });
};

export const updateProsjektTiltakVurdering = (id, vurderingId) => {
  return API.patch(`/prosjekt-tiltak/${id}/vurdering`, { vurderingId });
};

export const updateProsjektTiltakMerknad = (id, merknad) => {
  return API.patch(`/prosjekt-tiltak/${id}/merknad`, { merknad });
};
