import { API } from "../../index";
import { getPaginatedData } from "../common/pagination";

// Tiltak API endpoints
export const getTiltak = () => API.get("/tiltak");
export const createTiltak = (data) => API.post("/tiltak", data);
export const deleteTiltak = (id) => API.delete(`/tiltak/${id}`);
