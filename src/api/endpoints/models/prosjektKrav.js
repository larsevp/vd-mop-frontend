// Generated API endpoints for ProsjektKrav
import { API } from "@/api";
import { getPaginatedData } from "@/api/endpoints/common/pagination";
import { cleanEntityData } from "@/pages/KravTiltak/shared/utils/dataCleaningUtils";

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

export const getProsjektKravSimple = (projectId = null) => {
  const config = addProsjektKravFieldExclusion("simple");
  const params = projectId ? { projectId: projectId.toString() } : {};

  return API.get("/prosjekt-krav/simple", {
    ...config,
    params
  });
};

export const createProsjektKrav = async (prosjektKravData) => {
  // Get current project from store
  const { useProjectStore } = await import("@/stores/userStore");
  const { currentProject } = useProjectStore.getState();
  const projectId = currentProject?.id;

  if (!projectId || isNaN(Number(projectId))) {
    throw new Error('Ingen gyldig prosjekt valgt. Vennligst velg et prosjekt før du oppretter krav.');
  }

  // Use common data cleaning utility to strip frontend-only fields
  const cleanData = cleanEntityData(prosjektKravData);

  // Also strip auto-generated fields that should only be set by backend
  const { kravUID, id, createdAt, updatedAt, createdBy, updatedBy, ...finalData } = cleanData;

  // Include projectId in the data
  const dataWithProjectId = {
    ...finalData,
    projectId: Number(projectId)
  };

  return API.post("prosjekt-krav", dataWithProjectId);
};

export const updateProsjektKrav = (id, prosjektKravData) => {
  // Use common data cleaning utility to strip frontend-only fields
  const cleanData = cleanEntityData(prosjektKravData);

  // Also strip auto-generated fields that should only be set by backend
  const { kravUID, createdAt, updatedAt, createdBy, updatedBy, ...finalData } = cleanData;

  return API.put(`prosjekt-krav/${id}`, finalData);
};

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

export const getPaginatedProsjektKravGroupedByEmne = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc", projectId = null, onlyProjectCreated = false) => {
  const config = addProsjektKravFieldExclusion("index");

  // Build params including projectId and onlyProjectCreated filter
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
    ...(projectId && { projectId: projectId.toString() }),
    ...(onlyProjectCreated && { onlyProjectCreated: 'true' }),
  });

  // Call the endpoint directly since we're building custom params
  return API.get(`/prosjekt-krav/grouped-by-emne/paginated?${params}`, config);
};

export const getProsjektKravById = (id, config = {}) => {
  const updatedConfig = addProsjektKravFieldExclusion("edit", config);
  return API.get(`/prosjekt-krav/${id}`, updatedConfig);
};

/**
 * Copy Krav to ProsjektKrav for a specific project
 * @param {number} projectId - The project ID
 * @param {number[]} kravIds - Optional array of specific Krav IDs to copy
 * @param {object} filters - Optional filters: { obligatorisk, kravpakkeIds, emneIds, statusIds }
 */
export const copyKravToProject = (projectId, kravIds = null, filters = null) => {
  const payload = { projectId };

  if (kravIds && Array.isArray(kravIds) && kravIds.length > 0) {
    payload.kravIds = kravIds;
  }

  if (filters) {
    payload.filters = filters;
  }

  return API.post("/prosjekt-krav/copy-from-krav", payload);
};

/**
 * Get import preview with counts and duplicate detection
 * @param {number} projectId - The project ID
 * @param {object} filters - Filters: { obligatorisk, kravpakkeIds, emneIds, statusIds }
 */
export const getImportPreview = (projectId, filters) => {
  return API.post("/prosjekt-krav/import-preview", {
    projectId,
    filters
  });
};

/**
 * Check if specific Krav IDs are already copied to project
 * @param {number} projectId - The project ID
 * @param {number[]} kravIds - Array of Krav IDs to check
 */
export const checkKravDuplicates = (projectId, kravIds) => {
  return API.post("/prosjekt-krav/check-duplicates", {
    projectId,
    kravIds
  });
};

/**
 * Mass copy ProsjektKrav from one project to another
 * Automatically batches large requests to avoid gateway timeout (504)
 * Preserves parent-child hierarchy across batches via idMapping
 *
 * @param {number[]} prosjektKravIds - Array of ProsjektKrav IDs to copy
 * @param {number} targetProjectId - Target project ID
 * @param {number} sourceProjectId - Source project ID
 * @param {boolean} includeRelatedTiltak - Whether to copy related ProsjektTiltak (default: false)
 * @param {function} onProgress - Optional callback for progress updates (0-100)
 */
export const massKopyProsjektKravToProject = async (prosjektKravIds, targetProjectId, sourceProjectId, includeRelatedTiltak = false, onProgress = null) => {
  const BATCH_SIZE = 30;

  // For small requests, send directly without batching
  if (prosjektKravIds.length <= BATCH_SIZE) {
    if (onProgress) onProgress(50);
    const result = await API.post("/prosjekt-krav/mass-copy", {
      prosjektKravIds,
      targetProjectId,
      sourceProjectId,
      includeRelatedTiltak
    });
    if (onProgress) onProgress(100);
    return result;
  }

  // Split into batches
  const batches = [];
  for (let i = 0; i < prosjektKravIds.length; i += BATCH_SIZE) {
    batches.push(prosjektKravIds.slice(i, i + BATCH_SIZE));
  }

  // Aggregate results
  const results = {
    krav: [],
    kravCount: 0,
    tiltakIds: [],
    tiltakCount: 0,
  };

  // Accumulated ID mapping for hierarchy preservation across batches
  let accumulatedIdMapping = {};

  // Process batches sequentially, passing accumulated idMapping
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Report progress (reserve 10% at start and end for setup/cleanup)
    if (onProgress) {
      const progress = 10 + Math.round((i / batches.length) * 80);
      onProgress(progress);
    }

    const response = await API.post("/prosjekt-krav/mass-copy", {
      prosjektKravIds: batch,
      targetProjectId,
      sourceProjectId,
      includeRelatedTiltak,
      existingIdMapping: accumulatedIdMapping
    });

    // Aggregate results
    if (response.data) {
      results.krav.push(...(response.data.krav || []));
      results.kravCount += response.data.kravCount || 0;
      results.tiltakIds.push(...(response.data.tiltakIds || []));
      results.tiltakCount += response.data.tiltakCount || 0;

      // Merge idMapping for next batch (preserves parent-child hierarchy)
      if (response.data.idMapping) {
        accumulatedIdMapping = { ...accumulatedIdMapping, ...response.data.idMapping };
      }
    }
  }

  if (onProgress) onProgress(100);
  return { data: results };
};

