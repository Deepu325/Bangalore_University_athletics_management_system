/**
 * API Configuration
 * Centralized API URL management for all frontend API calls
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

export const getApiUrl = (endpoint) => {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
};

export default API_BASE_URL;
