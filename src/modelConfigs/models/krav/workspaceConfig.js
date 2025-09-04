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
      fieldOverrides: {
        beskrivelse: { order: 2 },
        merknader: { order: 2 },
      },
      rows: {
        "merknad-row": {
          kravreferanse: { order: 3 },
          emneId: { order: 3 },
        },
      },
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
      fieldOverrides: {},
      rows: {
        "reference-row": {
          kravreferansetypeId: { order: 10 },
          lover: { order: 10 },
          kravpakker: { order: 10 },
        },
        "reference-row-2": {
          parentId: { order: 11 },
        },
      },
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
        informasjon: { order: 16 },
      },
      rows: {},
    },
  },

  fieldOverrides: {},
};

export const workspaceConfig = transformWorkspaceConfig(newKravWorkspaceConfig);
