// In dev we use same origin so Vite proxy forwards /api to http://localhost:8000.
// Set VITE_API_URL in .env to override (e.g. for production).
export const API_BASE = import.meta.env.VITE_API_URL || "";
