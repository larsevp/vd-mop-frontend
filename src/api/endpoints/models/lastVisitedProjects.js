import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// LastVisitedProject API endpoints
export const setLastVisitedProject = (lastVisitedProject) => API.post("/lastvisitedprojects", lastVisitedProject);
export const getLastVisitedProject = (userId, projectId) => API.get(`/lastvisitedprojects?userId=${userId}&projectId=${projectId}`);
export const getPaginatedLastVisitedProject = (page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc") =>
  getPaginatedData("/lastvisitedprojects", page, pageSize, search, sortBy, sortOrder);
