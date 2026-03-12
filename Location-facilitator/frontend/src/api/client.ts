import axios from 'axios';

// Ensure Vite env vars are loaded. Fallback to localhost if not set in dev.
const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default apiClient;
