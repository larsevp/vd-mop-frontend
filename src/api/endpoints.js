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

// User API endpoints (admin functionality)
export const getUsers = () => API.get('/user');
export const createUser = (user) => API.post('/user', user);
export const updateUser = (user) => API.put(`/user/${user.id}`, user);
export const deleteUser = (id) => API.delete(`/user/${id}`);

// Enhet API endpoints
export const getEnheter = () => API.get('/enhet');
export const createEnhet = (enhet) => API.post('/enhet', enhet);
export const updateEnhet = (enhet) => API.put(`/enhet/${enhet.id}`, enhet);
export const deleteEnhet = (id) => API.delete(`/enhet/${id}`);
