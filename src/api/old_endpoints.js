import { API } from "./index";

// Generic paginated function for all models
export const getPaginatedData = (endpoint, page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
  });
  return API.get(`${endpoint}/paginated?${params}`);
};

// Other endpoints
// Get potential parents for enhet based on level
export const getPotentialParents = (level) => API.get(`/enhet/potential-parents/${level}`);

// Tiltak API endpoints
export const getTiltak = () => API.get("/tiltak");
export const createTiltak = (data) => API.post("/tiltak", data);
export const deleteTiltak = (id) => API.delete(`/tiltak/${id}`);

// Prosjekt API endpoints
export const getProsjekter = () => API.get("/prosjekt");
export const createProsjekt = (data) => API.post("/prosjekt", data);
export const updateProsjekt = (prosjekt) => API.put(`/prosjekt/${prosjekt.id}`, prosjekt);
export const deleteProsjekt = (id) => API.delete(`/prosjekt/${id}`);
export const getPaginatedProsjekt = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/prosjekt", page, pageSize, search, sortBy, sortOrder);
export const getProsjektById = (id) => API.get(`/prosjekt/${id}`);

// User API endpoints (admin functionality)
export const getUsers = () => API.get("/user");
export const createUser = (user) => API.post("/user", user);
export const updateUser = (user) => API.put(`/user/${user.id}`, user);
export const deleteUser = (id) => API.delete(`/user/${id}`);
export const getPaginatedUser = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/user", page, pageSize, search, sortBy, sortOrder);
export const getUserById = (id) => API.get(`/user/${id}`);
// Enhet API endpoints
export const getEnheter = () => API.get("/enhet");
export const createEnhet = (enhet) => API.post("/enhet", enhet);
export const updateEnhet = (enhet) => API.put(`/enhet/${enhet.id}`, enhet);
export const deleteEnhet = (id) => API.delete(`/enhet/${id}`);
export const getPaginatedEnhet = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/enhet", page, pageSize, search, sortBy, sortOrder);
export const getEnhetById = (id) => API.get(`/enhet/${id}`);

// LastVisitedProject API endpoints
export const setLastVisitedProject = (lastVisitedProject) => API.post("/lastvisitedprojects", lastVisitedProject);
export const getLastVisitedProject = (userId, projectId) => API.get(`/lastvisitedprojects?userId=${userId}&projectId=${projectId}`);
export const getPaginatedLastVisitedProject = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/lastvisitedprojects", page, pageSize, search, sortBy, sortOrder);

//----------------------## Emne API endpoints
export const getEmner = () => API.get("/emne");
export const createEmne = (emne) => API.post("emne", emne);
export const updateEmne = (emne) => API.put(`emne/${$emne.id}`, emne);
export const deleteEmne = (id) => API.delete(`emne/${id}`);
export const getPaginatedEmne = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/emne", page, pageSize, search, sortBy, sortOrder);
export const getEmneById = (id) => API.get(`/emne/${id}`);

//----------------------## Status API endpoints
export const getStatus = () => API.get("/status");
export const createStatus = (status) => API.post("status", status);
export const updateStatus = (status) => API.put(`status/${$status.id}`, status);
export const deleteStatus = (id) => API.delete(`status/${id}`);
export const getPaginatedStatus = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/status", page, pageSize, search, sortBy, sortOrder);
export const getStatusById = (id) => API.get(`/status/${id}`);

//----------------------## Vurdering API endpoints
export const getVurderinger = () => API.get("/vurdering");
export const createVurdering = (vurdering) => API.post("vurdering", vurdering);
export const updateVurdering = (vurdering) => API.put(`vurdering/${$vurdering.id}`, vurdering);
export const deleteVurdering = (id) => API.delete(`vurdering/${id}`);
export const getPaginatedVurdering = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/vurdering", page, pageSize, search, sortBy, sortOrder);
export const getVurderingById = (id) => API.get(`/vurdering/${id}`);

//----------------------## Kravpakker API endpoints
export const getKravpakker = () => API.get("/kravpakker");
export const createKravpakker = (kravpakker) => API.post("kravpakker", kravpakker);
export const updateKravpakker = (kravpakker) => API.put(`kravpakker/${$kravpakker.id}`, kravpakker);
export const deleteKravpakker = (id) => API.delete(`kravpakker/${id}`);
export const getPaginatedKravpakker = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/kravpakker", page, pageSize, search, sortBy, sortOrder);
export const getKravpakkerById = (id) => API.get(`/kravpakker/${id}`);

//----------------------## KravreferanseType API endpoints
export const getKravreferanseTyper = () => API.get("/kravreferansetype");
export const createKravreferanseType = (kravreferansetype) => API.post("kravreferansetype", kravreferansetype);
export const updateKravreferanseType = (kravreferansetype) => API.put(`kravreferansetype/${$kravreferansetype.id}`, kravreferansetype);
export const deleteKravreferanseType = (id) => API.delete(`kravreferansetype/${id}`);
export const getPaginatedKravreferanseType = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/kravreferansetype", page, pageSize, search, sortBy, sortOrder);
export const getKravreferanseTypeById = (id) => API.get(`/kravreferansetype/${id}`);
