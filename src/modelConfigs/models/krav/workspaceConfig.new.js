/**
 * Krav Model Workspace Configuration - New Structure
 * Simplified, more intuitive configuration format
 */

import { transformWorkspaceConfig } from "../../utils/workspaceConfigTransform.js";

// New simplified structure
const newKravWorkspaceConfig = {
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
      showHierarchy: false,
      showMerknader: false,
      showStatus: false,
      showVurdering: false,
      showPrioritet: false,
      showObligatorisk: true,
      showRelations: true,
    },
    cardFields: ["kravUID", "tittel", "beskrivelse", "obligatorisk"],
    relationships: ["files", "tiltak", "lover", "kravpakker"],
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
    "vurderingId",
    "statusId",
    "prioritet",
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
    "vurderingId",
    "statusId",
    "prioritet",
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
    "vurderingId",
    "statusId",
    "prioritet",
  ],

  // Sections with their field overrides and row definitions
  sections: {
    info: {
      title: "Grunnleggende informasjon",
      defaultExpanded: true,

      fieldOverrides: {
        beskrivelse: { order: 2 },
        merknader: { order: 2 },
        kravreferanse: { order: 3, row: "merknad-row" },
        emneId: { order: 3, row: "merknad-row" },
      },

      rows: {
        "merknad-row": {
          // Row-specific configurations can go here
          className: "grid grid-cols-2 gap-4",
        },
      },
    },

    status: {
      title: "Status og vurdering",
      defaultExpanded: true,

      fieldOverrides: {
        // Status fields would go here when uncommented
      },

      rows: {},
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

      fieldOverrides: {
        kravreferansetypeId: { order: 10, row: "reference-row" },
        lover: { order: 10, row: "reference-row" },
        kravpakker: { order: 10, row: "reference-row" },
        parentId: { order: 11, row: "reference-row-2" },
      },

      rows: {
        "reference-row": {
          className: "grid grid-cols-3 gap-4",
        },
        "reference-row-2": {
          className: "grid grid-cols-1 gap-4",
        },
      },
    },

    admin: {
      title: "Administrative detaljer",
      defaultExpanded: false,

      fieldOverrides: {
        obligatorisk: { order: 14, row: "admin-row" },
        enhetId: { order: 14, row: "admin-row" },
        givenOrder: { order: 15 },
      },

      rows: {
        "admin-row": {
          className: "grid grid-cols-2 gap-4",
        },
      },
    },

    metadata: {
      title: "Metadata",
      defaultExpanded: false,

      fieldOverrides: {},
      rows: {},
    },

    annet: {
      title: "",
      defaultExpanded: true,
      noTitle: true,

      fieldOverrides: {
        informasjon: { order: 16 },
      },

      rows: {},
    },
  },

  // Global field overrides (outside of sections)
  fieldOverrides: {
    // Any field overrides that don't belong to specific sections
  },
};

// Transform to legacy format for backward compatibility
export const workspaceConfig = transformWorkspaceConfig(newKravWorkspaceConfig);

// Export the new structure for reference/debugging
export const newFormatConfig = newKravWorkspaceConfig;
