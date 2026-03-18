# Release Notes

## 2026-03-08

API-Manager-II now connects directly to the Opey backend from the browser. The Opey backend's `CORS_ALLOWED_ORIGINS` env var must include the API-Manager-II URL (e.g. `http://localhost:3003`), and `PUBLIC_OPEY_BASE_URL` must be set in API-Manager-II's `.env` (e.g. `http://localhost:5000`).
