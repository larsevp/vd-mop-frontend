// Mock API for Jest tests
import axios from "axios";

// For tests we don't need a real baseURL; axios is mocked in setupTests.
// Avoid env deps and concrete URLs to prevent secret-scan matches.
export const API = axios.create({
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default API;
