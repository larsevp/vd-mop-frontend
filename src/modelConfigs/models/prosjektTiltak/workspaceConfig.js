import { transformWorkspaceConfig } from "../../utils/workspaceConfigTransform.js";

const workspaceConfigData = {
  workspace: {
    enabled: true,
    layout: "split",
    groupBy: "emne",
    layoutConfig: {
      enableKeyboardNav: true,
    },

    ui: {
      showHierarchy: true,
      showMerknader: true,
      showStatus: true,
      showVurdering: true,
      showPrioritet: true,
      showObligatorisk: false,
      showRelations: true,
    },
  },

  workspaceHiddenIndex: [
    "givenOrder",
    "updatedBy",
    "createdBy",
    "tiltakUID",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "generalTiltakId",
    "enhetId",
    "obligatorisk",
  ],
  workspaceHiddenEdit: [
    "tiltakUID",
    "updatedBy",
    "createdBy",
    "givenOrder",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "generalTiltakId",
    "enhetId",
    "obligatorisk",
  ],
  workspaceHiddenCreate: [
    "tiltakUID",
    "updatedBy",
    "createdBy",
    "givenOrder",
    "beskrivelseSnippet",
    "implementasjonSnippet",
    "tilbakemeldingSnippet",
    "generalTiltakId",
    "enhetId",
    "obligatorisk",
  ],

  sections: {
    info: {
      title: "Grunnleggende informasjon",
      defaultExpanded: true,
      fieldOverrides: {
        beskrivelse: { order: 2 },
        merknad: { order: 2 },
        implementasjon: { order: 3 },
      },
      rows: {
        "main-row": {
          navn: {},
        },
        "main-row-2": {
          vurderingId: { order: 5 },
          statusId: { order: 6 },
          prioritet: { order: 7 },
        },
        "emne-row": {
          emneId: { order: 3 },
          prosjektKrav: { order: 4 },
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
        tilbakemelding: { order: 10 },
      },
      rows: {},
    },
  },

  fieldOverrides: {},
};

export const workspaceConfig = transformWorkspaceConfig(workspaceConfigData);
