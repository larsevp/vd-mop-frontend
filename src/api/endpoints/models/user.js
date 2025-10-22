import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// User API endpoints (admin functionality)
export const getUsers = () => API.get("/user");
export const createUser = (user) => API.post("/user", user);
export const updateUser = (user) => API.put(`/user/${user.id}`, user);
export const deleteUser = (id) => API.delete(`/user/${id}`);
export const getPaginatedUser = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/user", page, pageSize, search, sortBy, sortOrder);
export const getUserById = (id) => API.get(`/user/${id}`);

// User preferences (non-admin)
export const setActiveFagomrade = (fagomradeId) => API.post("/user/set-active-fagomrade", { fagomradeId });
