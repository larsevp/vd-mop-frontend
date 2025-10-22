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
  },

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
        { field: "tittel" },                        // 1. Title (full-width)
        { field: "beskrivelse" },                   // 2. Description (full-width)
        { row: ["emneId", "kravreferanse"] },       // 3. Subject & Reference (side-by-side)
        { field: "informasjon" },                   // 4. Information (full-width)
        { field: "merknader" },                     // 5. Notes (full-width)
      ],
    },
    status: {
      title: "Status og vurdering",
      defaultExpanded: true,
      fieldOverrides: {},
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
      layout: [
        { row: ["kravreferansetypeId", "lover", "kravpakker"] },  // 1. Ref type, Laws, Packages
        { field: "parentId" },                                     // 2. Parent (full-width)
      ],
    },
    admin: {
      title: "Administrative detaljer",
      defaultExpanded: false,
      layout: [
        { row: ["obligatorisk", "enhetId"] },     // 1. Required, Unit (side-by-side)
        { field: "givenOrder" },                  // 2. Order (full-width)
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
        { field: "informasjon" },                 // 1. Information (full-width)
      ],
    },
  },

  fieldOverrides: {},
};

export const workspaceConfig = transformWorkspaceConfig(newKravWorkspaceConfig);
