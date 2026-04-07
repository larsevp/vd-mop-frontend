# API Layer

## Axios Client (`index.js`)
Dual auth interceptors:
- **MSAL (prod)**: `acquireTokenSilent()` → Authorization header
- **Manual (dev)**: localStorage token → Authorization header + `x-user-id`

Response interceptor handles 401: refresh for manual auth, redirect for MSAL. Error storm prevention (max 5 in 30s).

## Endpoint Pattern (`endpoints/models/`)
Each model file exports: CRUD functions + paginated queries + relationship management.
- Field exclusion: `X-Exclude-Fields` header (suppress heavy fields in list views)
- Field inclusion: `X-Only-Fields` header (multiselect queries)
- Data cleaning: strips frontend-only fields before POST/PUT

## TanStack Query (`queryClient.js`)
- Cache time: 0.5s, stale time: 5min
- 401: no retry. Other errors: 3 retries.
- Global auth error handler on QueryCache.
