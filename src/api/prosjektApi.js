import { API } from './index';

export async function getProsjekter() {
  return API.get('/prosjekt');
}

export async function createProsjekt(prosjekt) {
  return API.post('/prosjekt', prosjekt);
}

export async function updateProsjekt(prosjekt) {
  return API.put(`/prosjekt/${prosjekt.id}`, prosjekt);
}

export async function deleteProsjekt(id) {
  return API.delete(`/prosjekt/${id}`);
}
