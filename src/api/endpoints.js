import { API } from './index';

// Tiltak API endpoints
export const getTiltak = () => API.get('/tiltak');
export const createTiltak = (data) => API.post('/tiltak', data);
export const deleteTiltak = (id) => API.delete(`/tiltak/${id}`);

// Prosjekt API endpoints
export const getProsjekter = () => API.get('/prosjekt');
export const createProsjekt = (data) => API.post('/prosjekt', data);
export const updateProsjekt = (prosjekt) => API.put(`/prosjekt/${prosjekt.id}`, prosjekt);
export const deleteProsjekt = (id) => API.delete(`/prosjekt/${id}`);
export const getPaginatedProsjekt = (page = 1, pageSize = 10) => {
  return API.get(`/prosjekt/paginated?page=${page}&pageSize=${pageSize}`);
};
// User API endpoints (admin functionality)
export const getUsers = () => API.get('/user');
export const createUser = (user) => API.post('/user', user);
export const updateUser = (user) => API.put(`/user/${user.id}`, user);
export const deleteUser = (id) => API.delete(`/user/${id}`);
export const getPaginatedUser = (page = 1, pageSize = 10) => {
  return API.get(`/user/paginated?page=${page}&pageSize=${pageSize}`);
};
// Enhet API endpoints
export const getEnheter = () => API.get('/enhet');
export const createEnhet = (enhet) => API.post('/enhet', enhet);
export const updateEnhet = (enhet) => API.put(`/enhet/${enhet.id}`, enhet);
export const deleteEnhet = (id) => API.delete(`/enhet/${id}`);
export const getPaginatedEnhet = (page = 1, pageSize = 10, search = '') => {
  console.log(`getPaginatedEnhet called with page: ${page}, pageSize: ${pageSize}, search: ${search}`);
  return API.get(`/enhet/paginated?page=${page}&pageSize=${pageSize}&search=${search}`);
};

// LastVisitedProject API endpoints
export const setLastVisitedProject = (lastVisitedProject) => API.post('/lastvisitedprojects', lastVisitedProject)
export const getLastVisitedProject = (userId, projectId) =>
  API.get(`/lastvisitedprojects?userId=${userId}&projectId=${projectId}`);
export const getPaginatedLastVisitedProject = (page = 1, pageSize = 10) => {
  return API.get(`/lastvisitedprojects/paginated?page=${page}&pageSize=${pageSize}`);
};