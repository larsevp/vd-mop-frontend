/**
 * ProsjektKrav Model Workspace Configuration - New Structure
 * Simplified, more intuitive configuration format
 *
 * NOTE: This file may need to be moved to /pages/KravTiltak/prosjektkrav/
 * as part of the new entity-specific folder structure
 */

import { transformWorkspaceConfig } from "../../utils/workspaceConfigTransform.js";

// New simplified structure
const newProsjektKravWorkspaceConfig = {
  // Basic workspace settings
  workspace: {
    enabled: true,
    layout: "split",
    groupBy: "emne",
    layoutConfig: {
      enableKeyboardNav: true,
    },

    ui: {
      showHierarchy: true,
      showMerknader: false,
      showStatus: false,
      showVurdering: false,
      showPrioritet: false,
      showObligatorisk: false,
      showRelations: true,
    },
  },

  // Hidden fields in different contexts
  workspaceHiddenIndex: [
    "versjon",
    "updatedBy",
    "createdBy",
    "kravStatus",
    "givenOrder",
    "kravUID",
    "beskrivelseSnippet",
    "informasjonSnippet",
    "projectId",
    "enhetId",
    "givenOrder",
    "obligatorisk",
    "vurderingId",
  ],
  workspaceHiddenEdit: [
    "kravUID",
    "updatedBy",
    "createdBy",
    "versjon",
    "kravStatus",
    "givenOrder",
    "beskrivelseSnippet",
    "informasjonSnippet",
    "projectId",
    "enhetId",
    "givenOrder",
    "obligatorisk",
    "vurderingId",
  ],
  workspaceHiddenCreate: [
    "kravUID",
    "updatedBy",
    "createdBy",
    "versjon",
    "kravStatus",
    "givenOrder",
    "beskrivelseSnippet",
    "informasjonSnippet",
    "projectId",
    "enhetId",
    "givenOrder",
    "obligatorisk",
    "vurderingId",
  ],

  // Sections with their field overrides and row definitions
  sections: {
    info: {
      title: "Grunnleggende informasjon",
      defaultExpanded: true,
      layout: [
        { field: "beskrivelse" }, // 1. Description (full-width)
        { row: [
          "emneId",
          "kravreferanse",
          { name: "kravreferansetypeId", default: 1 }  // 2c. Type with default
        ]}, // 2. Subject & Reference (side-by-side)
        { field: "informasjon" }, // 3. Information (full-width)
        { field: "merknader" }, // 4. Notes (full-width)
      ],
    },
    status: {
      title: "Status og prioritet",
      defaultExpanded: false,
      layout: [
        { row: ["statusId", "prioritet"] }, // 1. Status & Priority (side-by-side)
      ],
    },
    details: {
      title: "Detaljert informasjon",
      defaultExpanded: false,
      fieldOverrides: {},
      rows: {},
    },
    references: {
      title: "Referanser",
      defaultExpanded: false,
      layout: [
        { row: ["parentId"] }, // 1. Parent, Ref Type (side-by-side)
        { field: "versjon" }, // 2. Version (full-width)
      ],
    },
    admin: {
      title: "Administrative detaljer",
      defaultExpanded: false,
      layout: [
        { row: ["enhetId", "obligatorisk"] }, // 1. Unit, Required (side-by-side)
        { field: "givenOrder" }, // 2. Order (full-width)
      ],
    },
    metadata: {
      title: "Metadata",
      defaultExpanded: false,
      layout: [
        { field: "kravUID" }, // 1. Krav UID (full-width)
        { row: ["createdBy", "updatedBy"] }, // 2. Created/Updated by (side-by-side)
      ],
    },
    annet: {
      title: "",
      defaultExpanded: true,
      noTitle: true,
      layout: [
        { field: "files" }, // 1. Files (full-width)
      ],
    },
  },

  // Global field overrides (outside of sections)
  fieldOverrides: {},
};

// Transform to legacy format for backward compatibility
export const workspaceConfig = transformWorkspaceConfig(newProsjektKravWorkspaceConfig);
