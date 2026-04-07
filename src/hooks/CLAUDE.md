# Hooks

## Custom Hooks
- **useAuth.js** — MSAL ↔ user store sync. Extracts user from MSAL, merges with backend data (rolle, enhetId). Error rate limiting (max 5 in 30s).
- **useBackNavigation.js** — Smart back button. Static ROUTE_PARENTS mapping, tries history.back() first, falls back to parent route. Special handling for combined/flow views.
- **useLastVisitedProjects.js** — React Query hook for project visit tracking. Optimistic updates + backend sync. Keeps 5 most recent.
- **useLogout.js** — Unified logout for MSAL + manual auth. Clears localStorage tokens, cache, redirects.
- **useWorkspaceParams.js** — Two-way URL ↔ store sync for `fagomradeId` and `projectId`. Makes workspace URLs shareable.
- **useSmartBack.js** — Deprecated/empty.
