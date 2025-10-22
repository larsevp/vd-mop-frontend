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

    // Configuration for "Lag tilknyttet tiltak" creation flow
    detailFormLinked: {
      sections: {
        main: {
          title: "Tilknyttet tiltak",
          defaultExpanded: true,
          layout: [
            { field: "beskrivelse" },                           // 1. Description (full-width)
            { field: "merknad" },                               // 2. Note (full-width)
            { row: ["vurderingId", "statusId", "prioritet"] },  // 3. Assessment, Status, Priority
            { row: ["emneId", "obligatorisk"] },                // 4. Subject, Required
          ],
        },
        implementation: {
          title: "Implementasjon og tilbakemelding",
          defaultExpanded: false,
          layout: [
            { field: "implementasjon" },                        // 1. Implementation (full-width)
            { field: "tilbakemelding" },                        // 2. Feedback (full-width)
          ],
        },
        admin: {
          title: "Administrative detaljer",
          defaultExpanded: false,
          layout: [
            { field: "enhetId" },                               // 1. Unit (full-width)
          ],
        }
      },
      workspaceHiddenCreate: [
        "tiltakUID",
        "updatedBy",
        "createdBy",
        "krav", // Hidden - pre-filled from source krav
        "parentId", // Not needed for linked tiltak
        "givenOrder",
        "beskrivelseSnippet",
        "implementasjonSnippet",
        "tilbakemeldingSnippet",
      ],
      workspaceHiddenIndex: [
        "givenOrder",
        "updatedBy",
        "createdBy",
        "tiltakUID",
        "beskrivelseSnippet",
        "implementasjonSnippet",
        "tilbakemeldingSnippet",
      ],
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
      layout: [
        { field: "beskrivelse" },                   // 1. Description (full-width)
        { field: "merknad" },                       // 2. Note (full-width)
        { row: ["emneId", "krav", "parentId"] },    // 3. Subject, Requirement, Parent (side-by-side)
      ],
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
      layout: [
        { row: ["obligatorisk", "enhetId"] },       // 1. Required, Unit (side-by-side)
        { field: "givenOrder" },                    // 2. Order (full-width)
      ],
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
      layout: [
        { field: "implementasjon" },                // 1. Implementation (full-width)
        { field: "tilbakemelding" },                // 2. Feedback (full-width)
      ],
    },
  },

  // Global field overrides (outside of sections)
  fieldOverrides: {},
};

// Transform to legacy format for backward compatibility
export const workspaceConfig = transformWorkspaceConfig(newTiltakWorkspaceConfig);
