/**
 * Krav Model Workspace Configuration - New Structure
 * Simplified, more intuitive configuration format
 */

import { transformWorkspaceConfig } from "../../utils/workspaceConfigTransform.js";

const newKravWorkspaceConfig = {
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

    // Article View Configuration (Cards Mode)
    articleView: {
      mainContentFields: ["beskrivelse", "informasjon"], // Rich text fields shown in article body
      merknadField: "merknader", // Note field
      statusFields: ["vurderingId", "statusId", "prioritet", "obligatorisk"], // Status metadata
    },
  },

  // View mode behavior settings
  // autoExpandSectionsWithContent: false, // Disable auto-expansion of sections with content in view mode

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

  sections: {
    info: {
      title: "Grunnleggende informasjon",
      defaultExpanded: true,
      layout: [
        { field: "tittel" }, // 1. Title (full-width)
        { field: "beskrivelse" }, // 2. Description (full-width)
      ],
    },
    kravinformasjon: {
      title: "Kravinformasjon",
      defaultExpanded: true,
      layout: [
        { row: ["emneId", "kravreferanse", "kravreferansetypeId"] },
        { row: ["lover", "kravpakker", "obligatorisk"] }, // 1. Subject, Reference, Type (side-by-side)
      ],
    },
    merinfo: {
      title: "Tilleggsinformasjon",
      defaultExpanded: false,
      layout: [
        { field: "merknader" }, // 1. Notes (full-width)
        { field: "informasjon" }, // 2. Information (full-width)
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
        { row: ["parentId"] }, // 1. Parent (full-width as row to match pattern)
        // 2. Laws, Packages (side-by-side)
      ],
    },
    admin: {
      title: "Administrative detaljer",
      defaultExpanded: false,
      layout: [
        { row: ["enhetId"] }, // 1. Unit, Required (side-by-side)
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

  fieldOverrides: {},
};

export const workspaceConfig = transformWorkspaceConfig(newKravWorkspaceConfig);
