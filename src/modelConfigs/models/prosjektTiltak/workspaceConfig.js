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

    // Configuration for "Lag tilknyttet prosjekttiltak" creation flow
    detailFormLinked: {
      sections: {
        main: {
          title: "Tilknyttet prosjekttiltak",
          defaultExpanded: true,
          layout: [
            { field: "beskrivelse" },                           // 1. Description (full-width)
            { field: "merknad" },                               // 2. Note (full-width)
            { field: "implementasjon" },                        // 3. Implementation (full-width)
            { row: ["vurderingId", "statusId", "prioritet"] },  // 4. Assessment, Status, Priority
            { field: "emneId" },                                // 5. Subject
          ],
        },
        implementation: {
          title: "Implementasjon og tilbakemelding",
          defaultExpanded: false,
          layout: [
            { field: "tilbakemelding" },                        // 1. Feedback (full-width)
          ],
        },
        admin: {
          title: "Administrative detaljer",
          defaultExpanded: false,
          layout: [],
        }
      },
      workspaceHiddenCreate: [
        "tiltakUID",
        "updatedBy",
        "createdBy",
        "prosjektKrav", // Hidden - pre-filled from source prosjektkrav
        "parentId", // Not needed for linked prosjekttiltak
        "givenOrder",
        "beskrivelseSnippet",
        "implementasjonSnippet",
        "tilbakemeldingSnippet",
        "generalTiltakId",
        "enhetId",
        "obligatorisk",
      ],
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
      layout: [
        { row: ["navn"] },                                    // 1. Name (single field in row)
        { field: "beskrivelse" },                             // 2. Description (full-width)
        { field: "merknad" },                                 // 3. Note (full-width)
        { row: ["emneId", "prosjektKrav", "parentId"] },      // 4. Subject, Project Req, Parent (side-by-side)
        { field: "implementasjon" },                          // 5. Implementation (full-width)
        { row: ["vurderingId", "statusId", "prioritet"] },    // 6. Assessment, Status, Priority (side-by-side)
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
