// Generated model config for Krav
import {
  getKrav,
  deleteKrav,
  createKrav,
  updateKrav,
  getPaginatedKrav,
  getPaginatedKravAll,
  getPaginatedKravGroupedByEmne,
  getKravById,
} from "@/api/endpoints";

export const krav = {
  queryKey: ["krav"],
  queryFn: getPaginatedKrav,
  queryFnAll: getPaginatedKravAll, // Get all fields including "informasjon"
  queryFnGroupedByEmne: getPaginatedKravGroupedByEmne, // Get Krav grouped by Emne
  getByIdFn: getKravById,
  createFn: createKrav,
  updateFn: updateKrav,
  deleteFn: deleteKrav,
  modelPrintName: "krav",
  title: "Krav",
  desc: "beskrivelse ...",
  newButtonLabel: "Nytt krav",

  // EntityWorkspace configuration
  workspace: {
    enabled: true,
    layout: "split", // Use new clean split view layout
    groupBy: "emne",

    // Layout configuration - Controls the visual layout and proportions
    layoutConfig: {
      listWidth: "35%", // Width of the list pane in split view (default: 35%)
      enableKeyboardNav: true, // Enable keyboard navigation (default: true)
    },

    features: {
      grouping: true,
      hierarchy: true,
      inlineEdit: true,
      search: true,
      filters: true,
      bulkActions: false,
    },
    /// Clear the specific viewOptions for krav
    //localStorage.removeItem('krav-viewOptions');

    // Then refresh the page
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

    // Detail form configuration - Controls how fields are organized and displayed in the detail pane
    detailForm: {
      // Workspace-level field hiding - Controls which fields are hidden in different contexts
      // These arrays contain field names that should be hidden in specific contexts
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
      ], // Fields to hide in view mode (when not editing)
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
      ], // Fields to hide when editing existing records
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
        details: {
          title: "Detaljert informasjon", // "Detailed Information" section
          defaultExpanded: false, // This section starts collapsed
        },
        references: {
          title: "Referanser", // "References and Versioning" section
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
          title: "", // "Metadata" section (created/updated info)
          defaultExpanded: true, // This section starts collapsed
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
        merknader: {
          section: "info", // Administrative notes
          order: 3,
        },
        kravreferanse: {
          section: "info", // Reference value
          order: 3,
        },
        parentId: {
          section: "info", // Task requirements
          order: 4,
          row: "main-row", // Group with administrative flags
        },
        emneId: {
          section: "info", // Reference value
          order: 4,
          row: "main-row",
        },
        /*
        statusId: {
          section: "status", // Current progress status
          order: 6,
          row: "status-row", // Same row as vurdering
        },

        // Status-related fields on same row for compact layout
        vurderingId: {
          section: "status", // Status and assessment tracking
          order: 7,
          row: "status-row", // Group with other status-related fields
        },

        prioritet: {
          section: "status", // Priority level for requirement management
          order: 8,
          row: "status-row", // Same row as vurdering and status
        },
        */

        // Reference and versioning information
        kravreferansetypeId: {
          section: "references", // Reference type
          order: 8,
          row: "reference-row", // Group with reference fields
        },
        lover: {
          section: "references", // Reference value
          order: 8,
          row: "reference-row", // Same row as reference type
        },
        kravpakker: {
          section: "references", // Reference value
          order: 8,
          row: "reference-row", // Same row as reference type
        },
        // Administrative information - context and requirements

        // Administrative information - context and requirements
        obligatorisk: {
          section: "admin", // Task requirements
          order: 11,
          row: "admin-row", // Group with administrative flags
        },
        // Administrative information - context and requirements
        enhetId: {
          section: "admin", // Task requirements
          order: 11,
          row: "admin-row", // Group with administrative flags
        },

        // Detailed information - separate section for additional content
        informasjon: {
          section: "annet", // Additional detailed information
          order: 5,
        },
      },
    },
  },
  newButtonLabel: "Nytt krav",
  fields: [
    {
      name: "kravUID",
      label: "Krav UID",
      type: "text",
      required: false,
      disabled: true,
      field_info: "Unik identifikator for kravet (genereres automatisk som GK + ID)",
      show_in_list: true,
      show_in_form: true,
    },
    {
      name: "tittel",
      label: "Tittel",
      type: "text",
      required: true,
      field_info: "En kort, beskrivende tittel for kravet. Bør være spesifikk og lett å forstå.",
    },
    {
      name: "beskrivelse",
      label: "Beskrivelse",
      type: "basicrichtext",
      required: true,
      placeholder: "Beskriv kravet i detalj...",
      field_info: "Detaljert beskrivelse av kravet med grunnleggende formatering (fet, kursiv, understreking, overskrifter).",
      hiddenIndex: true,
    },
    {
      name: "informasjon",
      label: "Informasjon",
      type: "richtext",
      required: false,
      placeholder: "Legg til detaljert informasjon om kravet...",
      field_info: "Rik tekst med støtte for formatering, lenker, tabeller og bilder. Lim inn bilder direkte fra utklippstavlen.",
      suppressIndex: true, // Don't include this rich text field in index/list views
      hiddenIndex: true,
    },
    {
      name: "beskrivelseSnippet",
      label: "Beskrivelse",
      type: "text",
      required: false,
      suppressIndex: false, // Don't include this rich text field in index/list views
      hiddenCreate: true,
      hiddenEdit: true,
      truncate: 20,
    },
    {
      name: "informasjonSnippet",
      label: "Informasjon",
      type: "text",
      required: false,
      suppressIndex: false, // Don't include this rich text field in index/list views
      hiddenCreate: true,
      hiddenEdit: true,
      truncate: 20,
    },
    //BeskrivelsePlain, informasjonPlain, BeskrivelseSnippet, InformasjonSnippet

    {
      name: "kravreferansetypeId",
      label: "Type krav",
      type: "kravreferansetypeselect",
      required: false,
      hideViewKrav: false, // Show in KravDetailDisplay view mode
      hideEditKrav: false, // Show in KravDetailDisplay edit mode
      hideCreateKrav: false, // Show in KravDetailDisplay create mode
      hideIndexKrav: true, // Hide in KravCard/list view
    },
    {
      name: "kravreferanse",
      label: "Kravreferanse",
      type: "text",
      placeholder: "Hvor kommer kravet fra?",
      required: false,
      hideViewKrav: false, // Show in KravDetailDisplay view mode
      hideEditKrav: false, // Show in KravDetailDisplay edit mode
      hideCreateKrav: false, // Show in KravDetailDisplay create mode
      hideIndexKrav: true, // Hide in KravCard/list view
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
      label: "GivenOrder",
      type: "number",
      required: false,
    },
    {
      name: "parentId",
      label: "Underkrav av:",
      type: "kravselect",
      required: false,
      field_info:
        "Velg et overordnet krav hvis dette kravet er et underkrav. Systemet forhindrer at krav med egne underkrav kan velges som foreldre for å unngå hierarkiproblemer.",
    },
    {
      name: "versjon",
      label: "Versjon",
      type: "text",
      required: false,
      hideViewKrav: true, // Hide in KravDetailDisplay view mode (less important)
      hideEditKrav: false, // Show in KravDetailDisplay edit mode
      hideCreateKrav: false, // Show in KravDetailDisplay create mode
      hideIndexKrav: true, // Hide in KravCard/list view
    },
    {
      name: "kravStatus",
      label: "KravStatus",
      type: "kravstatusselect",
      required: false,
    },
    {
      name: "merknader",
      label: "Merknader",
      type: "text",
      required: false,
    },
    {
      name: "vurderingId",
      label: "VurderingId",
      type: "number",
      required: false,
      type: "vurderingselect",
    },
    {
      name: "statusId",
      label: "StatusId",
      type: "number",
      required: false,
      type: "statusselect",
    },
    {
      name: "emneId",
      label: "Overordnet emne",
      type: "number",
      required: true,
      type: "emneselect",
    },
    {
      name: "enhetId",
      label: "Organisasjonstilhørlighet",
      type: "number",
      required: false,
      type: "enhetselect",
      defaultValue: "USER_ENHET_ID", // Special marker for user's enhetId
    },
    {
      name: "createdBy",
      label: "CreatedBy",
      type: "number",
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
      type: "userselect",
    },
    {
      name: "updatedBy",
      label: "UpdatedBy",
      type: "number",
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
      type: "userselect",
    },
    {
      name: "lover",
      label: "Lover og forskrifter",
      type: "multiselect",
      entityType: "lov",
      required: false,
      field_info: "Velg hvilke lover og forskrifter som gjelder for dette kravet",
      suppressIndex: true, // Don't include this many-to-many relationship in index views
    },
    {
      name: "kravpakker",
      label: "Kravpakker",
      type: "multiselect",
      entityType: "kravpakker",
      required: false,
      field_info: "Velg hvilke kravpakker (f.eks. BREEAM NOR) dette kravet tilhører",
      suppressIndex: true, // Don't include this many-to-many relationship in index views
    },
    {
      name: "files",
      label: "Vedlegg",
      type: "fileupload",
      required: false,
      field_info: "Last opp dokumenter, bilder eller andre filer knyttet til dette kravet",
      hiddenIndex: true, // Don't show in list view
      suppressIndex: true, // Don't include in index views
    },
  ],
};
