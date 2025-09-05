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
      listWidth: "35%",
      enableKeyboardNav: true,
    },
    features: {
      grouping: true,
      hierarchy: true,
      inlineEdit: true,
      search: true,
      filters: true,
      bulkActions: false,
    },
    ui: {
      showHierarchy: true,
      showMerknader: true,
      showStatus: false,
      showVurdering: true,
      showPrioritet: true,
      showObligatorisk: false,
      showRelations: true,
    },
    cardFields: ["kravUID", "tittel", "beskrivelse", "obligatorisk"],
    relationships: ["files", "prosjektTiltak", "lover", "kravpakker"],
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
  ],

  // Sections with their field overrides and row definitions
  sections: {
    info: {
      title: "Grunnleggende informasjon",
      defaultExpanded: true,
      fieldOverrides: {
        tittel: { order: 1 },
        beskrivelse: { order: 2 },
        merknader: { order: 2 },
        informasjon: { order: 3 },
      },
      rows: {
        "merknad-row": {
          emneId: { order: 3 },
          kravreferanse: { order: 3 },
        },
        "main-row-2": {
          vurderingId: { order: 5 },
          statusId: { order: 6 },
          prioritet: { order: 7 },
        },
      },
    },
    status: {
      title: "Status og vurdering",
      defaultExpanded: true,
      fieldOverrides: {},
      rows: {
        "status-row": {
          kravStatus: { order: 7 },
        },
      },
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
      fieldOverrides: {},
      rows: {
        "reference-row": {
          parentId: { order: 10 },
          kravreferansetypeId: { order: 10 },
          versjon: { order: 11 },
        },
      },
    },
    admin: {
      title: "Administrative detaljer",
      defaultExpanded: false,
      fieldOverrides: {},
      rows: {
        "admin-row": {
          enhetId: { order: 14 },
          givenOrder: { order: 15 },
          obligatorisk: { order: 15, default: "false" },
        },
      },
    },
    metadata: {
      title: "Metadata",
      defaultExpanded: false,
      fieldOverrides: {
        kravUID: { order: 18 },
      },
      rows: {
        "metadata-row": {
          createdBy: { order: 19 },
          updatedBy: { order: 20 },
        },
      },
    },
    annet: {
      title: "",
      defaultExpanded: true,
      noTitle: true,
      fieldOverrides: {
        files: { order: 16 },
      },
      rows: {},
    },
  },

  // Global field overrides (outside of sections)
  fieldOverrides: {},
};

// Transform to legacy format for backward compatibility
export const workspaceConfig = transformWorkspaceConfig(newProsjektKravWorkspaceConfig);
