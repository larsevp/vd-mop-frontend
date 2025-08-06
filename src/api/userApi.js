import { API } from './index';

// Get current user info (role and name)
export async function getCurrentUserInfo() {
  return API.get('/user/me');
}

// CRUD API for users (admin functionality)
export async function getUsers() {
  return API.get('/user');
}

export async function createUser(user) {
  return API.post('/user', user);
}

export async function updateUser(user) {
  return API.put(`/user/${user.id}`, user);
}

export async function deleteUser(id) {
  return API.delete(`/user/${id}`);
}
