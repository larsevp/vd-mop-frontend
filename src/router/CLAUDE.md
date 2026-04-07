# Router

## Flow
`AppRouter.jsx` → checks `isManualLogin` → routes to MSAL or manual auth flow → `AuthenticatedRoutes.jsx`

## Auth Flows (`AuthFlow.jsx`)
- `AuthenticatedApp` — MSAL wrapper with `AuthenticatedTemplate`
- `ManualAuthenticatedApp` — skips MSAL, goes directly to routes

## Route Structure (`AuthenticatedRoutes.jsx`)
All under `MainLayout` (HeaderNav + Outlet):

**Landing:** `/` → LandingPage, `/prosjekt/:id` → ProjectLanding

**Workspace routes:**
- `/krav-workspace`, `/tiltak-workspace`
- `/prosjekt-krav-workspace`, `/prosjekt-tiltak-workspace`
- `/krav-tiltak-combined`, `/prosjekt-krav-tiltak-combined`
- `/prosjekt-krav-tiltak-flow`, `/prosjekt-tiltak-flow`

**Admin CRUD routes:**
- `/krav`, `/tiltak`, `/prosjekter`, `/enheter`, `/emner`, `/fagomrader`
- `/status`, `/vurderinger`, `/lover`, `/kravpakker`, `/kravreferansetyper`
- `/brukere` + create/edit variants

**Pattern:** Most entities have both table CRUD (`/krav`) and workspace (`/krav-workspace`) routes.
