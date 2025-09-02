// Generated model config for ProsjektKrav
import {
  getProsjektKrav,
  deleteProsjektKrav,
  createProsjektKrav,
  updateProsjektKrav,
  getPaginatedProsjektKrav,
  getPaginatedProsjektKravAll,
  getPaginatedProsjektKravGroupedByEmne,
  getProsjektKravById,
} from "@/api/endpoints";
import { useProjectStore } from "@/stores/userStore";

// Project-aware query functions that automatically include current project context
const createProjectAwareQueryFn = (baseFn) => {
  return (page, pageSize, search, sortBy, sortOrder) => {
    const { currentProject } = useProjectStore.getState();
    const projectId = currentProject?.id;

    // If no valid project ID, return empty result instead of invalid query
    if (!projectId || isNaN(Number(projectId))) {
      console.warn("ProsjektKrav query: No valid project selected, returning empty result");
      return Promise.resolve({
        data: {
          items: [],
          count: 0,
          totalPages: 0,
          currentPage: page,
        },
      });
    }

    return baseFn(page, pageSize, search, sortBy, sortOrder, Number(projectId));
  };
};

export const prosjektKrav = {
  queryKey: ["prosjektKrav"], // Keep simple array for admin compatibility

  // Base API functions for admin pages (no project context)
  queryFn: getPaginatedProsjektKrav,
  queryFnAll: getPaginatedProsjektKravAll,
  queryFnGroupedByEmne: getPaginatedProsjektKravGroupedByEmne,

  // Project-aware functions for workspace (used by useEntityData)
  queryFnWorkspace: createProjectAwareQueryFn(getPaginatedProsjektKrav),
  queryFnAllWorkspace: createProjectAwareQueryFn(getPaginatedProsjektKravAll),
  queryFnGroupedByEmneWorkspace: createProjectAwareQueryFn(getPaginatedProsjektKravGroupedByEmne),

  getByIdFn: getProsjektKravById,
  createFn: createProsjektKrav,
  updateFn: updateProsjektKrav,
  deleteFn: deleteProsjektKrav,
  modelPrintName: "prosjektKrav",
  title: "Prosjekt Krav",
  desc: "beskrivelse ...",
  newButtonLabelText: "Nytt prosjekt krav",

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

    ui: {
      showHierarchy: true,
      showMerknader: true,
      showStatus: false,
      showVurdering: true,
      showPrioritet: true,
      showObligatorisk: false,
      showRelations: true,
    },
    cardFields: ["kravUID", "tittel", "beskrivelse", "obligatorisk"],
    relationships: ["files", "prosjektTiltak", "lover", "kravpakker"],

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
        // Basic info section - logical order from general to specific
        tittel: {
          section: "info", // Title is first in info section
          order: 1,
        },
        beskrivelse: {
          section: "info", // Primary content description
          order: 2,
        },
        merknader: {
          section: "info", // Administrative notes
          order: 2,
        },
        informasjon: {
          section: "info", // Additional detailed information
          order: 3,
        },
        emneId: {
          section: "info", // Reference value - moved below beskrivelse
          order: 3,
          row: "merknad-row",
        },

        kravreferanse: {
          section: "info", // Reference value
          order: 3,
          row: "merknad-row",
        },

        vurderingId: {
          section: "info", // Reference value - moved below beskrivelse
          order: 5,
          row: "main-row-2",
        },
        statusId: {
          section: "info", // Reference value - moved below beskrivelse
          order: 6,
          row: "main-row-2",
        },
        prioritet: {
          section: "info", // Priority value - moved below beskrivelse
          order: 7,
          row: "main-row-2",
        },

        // Status section
        kravStatus: {
          section: "status", // Status information
          order: 7,
          row: "status-row",
        },

        parentId: {
          section: "references", // Task requirements
          order: 10,
          row: "reference-row", // Group with administrative flags
        },
        // References section
        kravreferansetypeId: {
          section: "references", // Reference type
          order: 10,
          row: "reference-row", // Group with reference fields
        },
        versjon: {
          section: "references", // Version information
          order: 11,
          row: "reference-row",
        },

        // Administrative section
        enhetId: {
          section: "admin", // Organizational unit
          order: 14,
          row: "admin-row",
        },
        givenOrder: {
          section: "admin", // Order value
          order: 15,
          row: "admin-row",
        },
        obligatorisk: {
          section: "admin", // Requirements flag
          order: 15,
          row: "admin-row",
          default: "false",
        },

        // Files and additional information
        files: {
          section: "annet", // File attachments
          order: 16,
        },

        // Metadata (usually auto-managed)
        kravUID: {
          section: "metadata", // Unique identifier
          order: 18,
        },
        createdBy: {
          section: "metadata", // Creation info
          order: 19,
          row: "metadata-row",
        },
        updatedBy: {
          section: "metadata", // Update info
          order: 20,
          row: "metadata-row",
        },
      },
    },
  },
  newButtonLabelText: "Nytt prosjekt krav",
  fields: [
    {
      name: "kravUID",
      label: "Prosjekt Krav UID",
      type: "text",
      required: false,
      disabled: true,
      field_info: "Unik identifikator for prosjektkravet (genereres automatisk som GPK + ID)",
      show_in_list: true,
      show_in_form: true,
    },
    {
      name: "tittel",
      label: "Tittel",
      type: "text",
      required: true,
      field_info: "En kort, beskrivende tittel for prosjektkravet. Bør være spesifikk og lett å forstå.",
    },
    {
      name: "beskrivelse",
      label: "Beskrivelse",
      type: "basicrichtext",
      required: true,
      placeholder: "Beskriv prosjektkravet i detalj...",
      field_info: "Detaljert beskrivelse av prosjektkravet med grunnleggende formatering (fet, kursiv, understreking, overskrifter).",
      hiddenIndex: true,
    },
    {
      name: "informasjon",
      label: "Ytterligere informasjon",
      type: "richtext",
      required: false,
      placeholder: "Legg til detaljert informasjon om prosjektkravet...",
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
    {
      name: "kravreferansetypeId",
      label: "Type prosjekt krav",
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
      placeholder: "Hvor kommer prosjektkravet fra?",
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
      label: "Tilhører krav:",
      type: "prosjektKravselect",
      required: false,
      field_info:
        "Velg et overordnet prosjektkrav hvis dette kravet er et underkrav. Systemet forhindrer at krav med egne underkrav kan velges som foreldre for å unngå hierarkiproblemer.",
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
      name: "files",
      label: "Vedlegg",
      type: "fileupload",
      required: false,
      field_info: "Last opp dokumenter, bilder eller andre filer knyttet til dette prosjektkravet",
      hiddenIndex: true, // Don't show in list view
      suppressIndex: true, // Don't include in index views
    },
  ],
};
