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
      showKontroll: true,
      showRelations: true,
    },

    // Article View Configuration (Cards Mode)
    articleView: {
      mainContentFields: ["beskrivelse", "implementasjon", "styrendeDokumentasjon", "tilbakemelding"],
      merknadField: "merknad",
      statusFields: ["vurderingId", "statusId", "prioritet"],
      kontrollFields: {
        title: "Kontroll og styring",
        layout: [
          ["kontrollHyppighet", "kontrolleresVed"],
          ["kontrollobjekt", "kontrollDokumentasjon"],
          ["kontrollKommentar"],
        ],
      },
    },

    // Configuration for "Lag tilknyttet tiltak" creation flow
    detailFormLinked: {
      sections: {
        info: {
          title: "Grunnleggende informasjon",
          defaultExpanded: true,
          layout: [
            { field: "implementasjon" }, // 1. Implementation (full-width)
            { field: "styrendeDokumentasjon" }, // 2. Styrende dokumenter
          ],
        },
        prioritering: {
          title: "Organisering og prioritering",
          defaultExpanded: true,
          layout: [
            { row: ["emneId", "statusId", "prioritet"] }, // 1. Subject, Status, Priority (side-by-side)
            { field: "merknad" }, // 2. Note (full-width)
          ],
        },
        merinfo: {
          title: "Tilbakemelding og notater",
          defaultExpanded: false,
          layout: [
            { field: "tilbakemelding" }, // 1. Feedback (full-width)
            { field: "vurderingId" }, // 2. Assessment
          ],
        },
        references: {
          title: "Tilknytning",
          defaultExpanded: true,
          layout: [
            { field: "krav" }, // Show which krav this is connected to
          ],
        },
        admin: {
          title: "Administrative detaljer",
          defaultExpanded: false,
          layout: [
            { field: "enhetId" }, // 1. Unit (full-width)
            { field: "beskrivelse" }, // 2. Description (full-width) - moved from info section
          ],
        },
      },
      workspaceHiddenCreate: [
        "tiltakUID",
        "updatedBy",
        "createdBy",
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

  // View mode behavior settings
  // autoExpandSectionsWithContent: false, // Disable auto-expansion of sections with content in view mode

  // Hidden fields in different contexts
  workspaceHiddenIndex: [
    "givenOrder",
    "updatedBy",
    "createdBy",
    "tiltakUID",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "tilbakemelding",
    "vurderingId",
    "statusId",
    "prioritet",
    "lopendeKontroll",
  ],
  workspaceHiddenEdit: [
    "tiltakUID",
    "updatedBy",
    "createdBy",
    "givenOrder",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "tilbakemelding",
    "vurderingId",
    "statusId",
    "prioritet",
    "lopendeKontroll",
  ],
  workspaceHiddenCreate: [
    "tiltakUID",
    "updatedBy",
    "createdBy",
    "givenOrder",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "tilbakemelding",
    "vurderingId",
    "statusId",
    "prioritet",
    "lopendeKontroll",
  ],

  // Sections with their field overrides and row definitions
  sections: {
    info: {
      title: "Grunnleggende informasjon",
      defaultExpanded: true,
      layout: [
        { field: "beskrivelse", required: true },
        { field: "implementasjon" },
        { field: "styrendeDokumentasjon" },
      ],
    },
    prioritering: {
      title: "Organisering og prioritering",
      defaultExpanded: true,
      layout: [
        { row: ["emneId", "statusId", "prioritet"] },
        { field: "merknad" },
      ],
    },
    kontroll: {
      title: "Kontroll og styring",
      defaultExpanded: false,
      layout: [
        { field: "kontrollHyppighet" },
        { row: ["kontrolleresVed", "kontrollobjekt"] },
        { field: "kontrollDokumentasjon" },
        { field: "kontrollKommentar" },
      ],
    },
    merinfo: {
      title: "Tilbakemelding og notater",
      defaultExpanded: false,
      layout: [
        { field: "tilbakemelding" },
        { field: "vurderingId" },
      ],
    },
    references: {
      title: "Referanser",
      defaultExpanded: false,
      layout: [
        { row: ["krav", "parentId"] }, // 1. Requirement, Parent Tiltak (side-by-side)
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
        { field: "tiltakUID" }, // 1. Tiltak UID (full-width)
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
export const workspaceConfig = transformWorkspaceConfig(newTiltakWorkspaceConfig);
