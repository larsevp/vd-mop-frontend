// Generated model config for Tiltak
import {
  getTiltak,
  deleteTiltak,
  createTiltak,
  updateTiltak,
  getPaginatedTiltak,
  getPaginatedTiltakAll,
  getPaginatedTiltakGroupedByEmne,
  getTiltakById,
} from "@/api/endpoints";

export const tiltak = {
  queryKey: ["tiltak"],
  queryFn: getPaginatedTiltak,
  queryFnAll: getPaginatedTiltakAll, // Get all fields including rich text content
  queryFnGroupedByEmne: getPaginatedTiltakGroupedByEmne, // Get Tiltak grouped by Emne
  getByIdFn: getTiltakById,
  createFn: createTiltak,
  updateFn: updateTiltak,
  deleteFn: deleteTiltak,
  modelPrintName: "tiltak",
  title: "Tiltak",
  desc: "Beskrivelse av tiltak...",
  newButtonLabel: "Nytt tiltak",

  // EntityWorkspace configuration - Controls how the tiltak data is displayed and managed in the workspace
  workspace: {
    enabled: true, // Enable the EntityWorkspace component for this model
    layout: "split", // Layout type: "split" = sidebar + main content, "full" = full-width view
    groupBy: "emne", // Group tiltak records by their "emne" (subject/topic) relationship

    // Layout configuration - Controls the visual layout and proportions
    layoutConfig: {
      listWidth: "40%", // Width of the list pane in split view (default: 35%)
      enableKeyboardNav: true, // Enable keyboard navigation (default: true)
    },

    // Feature toggles - Controls which workspace features are available
    features: {
      grouping: true, // Enable grouping functionality (group records by specified field)
      search: true, // Enable search functionality across tiltak records
      filters: true, // Enable filter controls (status, priority, etc.)
    },

    // UI display preferences - Controls which UI elements are shown
    ui: {
      showHierarchy: false,
      showMerknader: false,
      showStatus: false,
      showVurdering: false,
      showPrioritet: false,
      showObligatorisk: true,
      showRelations: true,
    },
    // Fields to display in card view - These fields appear prominently on each tiltak card
    cardFields: ["tiltakUID", "tittel", "beskrivelse", "obligatorisk"],

    // EntityDetailPane-specific form configuration - Controls the detail view when clicking on a tiltak
    detailForm: {
      // Workspace-level field hiding - Controls which fields are hidden in different contexts
      // These arrays contain field names that should be hidden in specific contexts
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
      ], // Fields to hide in view mode (when not editing)
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
      ], // Fields to hide when editing existing records
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
      ], // Fields to hide when creating new records

      // Section organization - Organizes form fields into collapsible sections
      sections: {
        info: {
          title: "Grunnleggende informasjon", // Tittel vises ikke på info!!
          defaultExpanded: true, // This section starts expanded
        },
        status: {
          title: "Status og vurdering", // "Status and Assessment" section
          defaultExpanded: true, // This section starts expanded
        },
        implementation: {
          title: "Implementasjon og tilbakemelding", // "Implementation and Feedback" section
          defaultExpanded: false, // This section starts collapsed
        },
        references: {
          title: "Referanser", // "References" section
          defaultExpanded: false, // This section starts collapsed
        },
        admin: {
          title: "Administrative detaljer", // "Administrative Details" section
          defaultExpanded: false, // This section starts collapsed
        },
        metadata: {
          title: "Metadata", // "Metadata" section (created/updated info)
          defaultExpanded: false, // This section starts collapsed
        },
        annet: {
          title: "", // No title for this section
          defaultExpanded: true, // This section starts expanded
          noTitle: true,
        },
      },

      // Field customization for detail view - Override default field behavior in detail form
      fieldOverrides: {
        // Basic info - organized into logical sections
        beskrivelse: {
          section: "info", // Primary content description
          order: 2,
        },
        krav: {
          section: "info", // Related requirements
          order: 3,
          row: "emne-row", // Separate row for multiselect
        },
        emneId: {
          section: "info", // Reference value
          order: 4,
          row: "emne-row",
        },
        parentId: {
          section: "info", // Parent relationship
          order: 4,
          row: "emne-row", // Group with reference fields
        },

        merknad: {
          section: "info", // Administrative notes
          order: 4,
        },

        // Status-related fields (commented out in original - keeping same pattern)
        /*
        statusId: {
          section: "status", // Current progress status
          order: 6,
          row: "status-row", // Same row as vurdering
        },
        vurderingId: {
          section: "status", // Status and assessment tracking
          order: 7,
          row: "status-row", // Group with other status-related fields
        },
        prioritet: {
          section: "status", // Priority level for task management
          order: 8,
          row: "status-row", // Same row as vurdering and status
        },
        */

        // Implementation details - separate section for execution information
        implementasjon: {
          section: "annet", // How the task is carried out
          order: 5,
        },
        tilbakemelding: {
          section: "annet", // Feedback and results
          order: 6,
        },

        // Reference and relationship information

        // Administrative information - context and requirements
        obligatorisk: {
          section: "admin", // Task requirements
          order: 11,
          row: "admin-row", // Group with administrative flags
        },
        enhetId: {
          section: "admin", // Organizational assignment
          order: 11,
          row: "admin-row", // Same row as obligatorisk
        },
        givenOrder: {
          section: "admin", // Ordering information
          order: 12,
        },
      },
    },
  },
  fields: [
    {
      name: "tiltakUID",
      label: "Tiltak UID",
      type: "text",
      required: false,
      disabled: true,
      field_info: "Unik identifikator for tiltaket (genereres automatisk som GT + ID)",
      show_in_list: true,
      show_in_form: true,
    },
    {
      name: "tittel",
      label: "Tittel",
      type: "text",
      required: true,
      field_info: "En kort, beskrivende tittel for tiltaket. Bør være spesifikk og lett å forstå.",
    },
    {
      name: "beskrivelse",
      label: "Beskrivelse",
      type: "basicrichtext",
      required: true,
      placeholder: "Beskriv tiltaket i detalj...",
      field_info: "Detaljert beskrivelse av tiltaket med grunnleggende formatering (fet, kursiv, understreking, overskrifter).",
      hiddenIndex: true,
    },
    {
      name: "implementasjon",
      label: "Implementasjon",
      type: "richtext",
      required: false,
      placeholder: "Legg til informasjon om hvordan tiltaket skal implementeres...",
      field_info: "Rik tekst med støtte for formatering, lenker, tabeller og bilder. Lim inn bilder direkte fra utklippstavlen.",
      suppressIndex: true, // Don't include this rich text field in index/list views
      hiddenIndex: true,
    },
    {
      name: "tilbakemelding",
      label: "Tilbakemelding",
      type: "richtext",
      required: false,
      placeholder: "Legg til tilbakemelding på tiltaket...",
      field_info: "Rik tekst med støtte for formatering, lenker, tabeller og bilder for tilbakemelding.",
      suppressIndex: true, // Don't include this rich text field in index/list views
      hiddenIndex: true,
    },
    {
      name: "beskrivelseSnippet",
      label: "Beskrivelse",
      type: "text",
      required: false,
      suppressIndex: false,
      hiddenCreate: true,
      hiddenEdit: true,
      truncate: 20,
    },
    {
      name: "implementasjonSnippet",
      label: "Implementasjon",
      type: "text",
      required: false,
      suppressIndex: false,
      hiddenCreate: true,
      hiddenEdit: true,
      truncate: 20,
    },
    {
      name: "tilbakemeldingSnippet",
      label: "Tilbakemelding",
      type: "text",
      required: false,
      suppressIndex: false,
      hiddenCreate: true,
      hiddenEdit: true,
      truncate: 20,
    },
    {
      name: "merknad",
      label: "Merknad",
      type: "text",
      required: false,
      field_info: "Merknad til tiltaket",
      hiddenIndex: true,
    },
    {
      name: "obligatorisk",
      label: "Obligatorisk",
      type: "bool",
      required: false,
      default: false,
    },
    {
      name: "prioritet",
      label: "Prioritet",
      type: "prioritetselect",
      required: false,
      defaultValue: 15,
    },
    {
      name: "givenOrder",
      label: "Rekkefølge",
      type: "number",
      required: false,
      defaultValue: 300,
      field_info: "Muliggjør sortering av tiltak",
    },
    {
      name: "parentId",
      label: "Overordnet tiltak",
      type: "tiltakselect",
      required: false,
      field_info:
        "Velg et overordnet tiltak hvis dette tiltaket er et undertiltak. Systemet forhindrer at tiltak med egne undertiltak kan velges som foreldre for å unngå hierarkiproblemer.",
    },
    {
      name: "vurderingId",
      label: "Vurdering",
      type: "vurderingselect",
      required: false,
    },
    {
      name: "statusId",
      label: "Status",
      type: "statusselect",
      required: false,
    },
    {
      name: "emneId",
      label: "Emne",
      type: "emneselect",
      required: false,
      field_info: "Velg hvilket emne tiltaket tilhører",
    },
    {
      name: "enhetId",
      label: "Enhet",
      type: "enhetselect",
      required: false,
      defaultValue: "USER_ENHET_ID", // Special marker for user's enhetId
    },
    {
      name: "createdBy",
      label: "Opprettet av",
      type: "userselect",
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
    },
    {
      name: "updatedBy",
      label: "Oppdatert av",
      type: "userselect",
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
    },
    {
      name: "krav",
      label: "Tilknyttet krav",
      type: "multiselect",
      entityType: "krav",
      required: false,
      field_info: "Velg hvilke krav dette tiltaket adresserer eller oppfyller",
      suppressIndex: true, // Don't include this many-to-many relationship in index views
    },
    {
      name: "files",
      label: "Vedlegg",
      type: "fileupload",
      required: false,
      field_info: "Last opp dokumenter, bilder eller andre filer knyttet til dette tiltaket",
      hiddenIndex: true, // Don't show in list view
      suppressIndex: true, // Don't include in index views
    },
  ],
};
