import { API } from "../../index";

/**
 * Generic paginated function for all models
 * @param {string} endpoint - The API endpoint
 * @param {number} page - Page number (default: 1)
 * @param {number} pageSize - Items per page (default: 10)
 * @param {string} search - Search query (default: "")
 * @param {string} sortBy - Sort field (default: "")
 * @param {string} sortOrder - Sort order (default: "asc")
 * @param {Object} config - Additional axios config (headers, etc.)
 * @returns {Promise} API response
 */
export const getPaginatedData = (endpoint, page = 1, pageSize = 10, search = "", sortBy = "", sortOrder = "asc", config = {}) => {
  const params = new URLSearchParams({
    page: page.toString(),
    pageSize: pageSize.toString(),
    ...(search && { search }),
    ...(sortBy && { sortBy }),
    ...(sortOrder && { sortOrder }),
  });

  return API.get(`${endpoint}/paginated?${params}`, config);
};
