/**
 * Tiltak Model Workspace Configuration - New Structure
 * Simplified, more intuitive configuration format
 */

import { transformWorkspaceConfig } from "../../utils/workspaceConfigTransform.js";

// New simplified structure
const newTiltakWorkspaceConfig = {
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
    "givenOrder",
    "updatedBy",
    "createdBy",
    "tiltakUID",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "vurderingId",
    "statusId",
    "prioritet",
  ],
  workspaceHiddenEdit: [
    "tiltakUID",
    "updatedBy",
    "createdBy",
    "givenOrder",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "vurderingId",
    "statusId",
    "prioritet",
  ],
  workspaceHiddenCreate: [
    "tiltakUID",
    "updatedBy",
    "createdBy",
    "givenOrder",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
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
        merknad: { order: 2 },
      },
      rows: {
        "emne-row": {
          emneId: { order: 3 },
          krav: { order: 4 },
          parentId: { order: 5 },
        },
      },
    },
    status: {
      title: "Status og vurdering",
      defaultExpanded: true,
      fieldOverrides: {},
      rows: {},
    },
    implementation: {
      title: "Implementasjon og tilbakemelding",
      defaultExpanded: false,
      fieldOverrides: {},
      rows: {},
    },
    references: {
      title: "Referanser",
      defaultExpanded: false,
      fieldOverrides: {},
      rows: {},
    },
    admin: {
      title: "Administrative detaljer",
      defaultExpanded: false,
      fieldOverrides: {
        givenOrder: { order: 15 },
      },
      rows: {
        "admin-row": {
          obligatorisk: { order: 14 },
          enhetId: { order: 14 },
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
        implementasjon: { order: 10 },
        tilbakemelding: { order: 11 },
      },
      rows: {},
    },
  },

  // Global field overrides (outside of sections)
  fieldOverrides: {},
};

// Transform to legacy format for backward compatibility
export const workspaceConfig = transformWorkspaceConfig(newTiltakWorkspaceConfig);
