# Landing Pages

## LandingPage.jsx — Main Hub
Hero header + 3 quick-access cards (Generelle tiltak, Nytt prosjekt, Sist brukte). Projects table below.

## ProjectLanding.jsx — Project Detail
Two modes: list view (`/prosjekter`) and detail view (`/prosjekt/:id`).
Project header + import section (ImportKravWizard) + 3 module cards (ProsjektKrav, ProsjektTiltak, Combined).
Tracks visits via `trackProjectVisit()`.

## AdminLanding.jsx — Admin Panel
Collapsible sections: "Krav & Tiltak" (3 workspace cards) + "Administrasjon" (15+ admin CRUD cards).
All cards use `getModelConfig()` for labels/icons.
