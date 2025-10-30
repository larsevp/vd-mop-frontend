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
        beskrivelse: {
          title: "Beskrivelse",
          defaultExpanded: false, // Collapsed by default in edit mode
          layout: [
            { field: "beskrivelse" }, // Description at the top but collapsed
          ],
        },
        info: {
          title: "Grunnleggende informasjon",
          defaultExpanded: true,
          layout: [
            { field: "navn" }, // 1. Name (full-width)
            { field: "implementasjon" }, // 2. Implementation (full-width)
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
            { field: "prosjektKrav" }, // Show which prosjektkrav this is connected to
          ],
        },
      },
      workspaceHiddenCreate: [
        "tiltakUID",
        "updatedBy",
        "createdBy",
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

  // View mode behavior settings
  // autoExpandSectionsWithContent: false, // Disable auto-expansion of sections with content in view mode

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
        { field: "navn" }, // 1. Name (full-width)
        { field: "beskrivelse", required: true }, // 2. Description (full-width) - required for non-linked creation
        { field: "implementasjon" }, // 3. Implementation (full-width)
      ],
    },

    prioritering: {
      title: "Organisering og prioritering",
      defaultExpanded: true,
      layout: [
        { row: ["emneId", "statusId", "prioritet"] }, // 1. Assessment, Status, Priority (side-by-side)
        { field: "merknad" }, // 1. Note (full-width)
      ],
    },
    merinfo: {
      title: "Tilbakemelding og notater",
      defaultExpanded: false,
      layout: [
        { field: "tilbakemelding" }, // 2. Feedback (full-width)
        { field: "vurderingId" },
      ],
    },
    references: {
      title: "Referanser",
      defaultExpanded: false,
      layout: [
        { row: ["prosjektKrav", "parentId"] }, // 1. Project Req, Parent ProsjektTiltak (side-by-side)
        { row: ["generalTiltakId"] }, // 2. General Tiltak reference
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

  fieldOverrides: {
    beskrivelse: {
      hideInViewIfEmpty: true, // Only show beskrivelse in view mode if it has content
    },
  },
};

export const workspaceConfig = transformWorkspaceConfig(workspaceConfigData);
