export const fields = [
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
    name: "projectId",
    label: "ProsjektId",
    type: "number",
    required: true,
    placeholder: "",
    field_info: "",
    hiddenIndex: false,
  },
  {
    name: "informasjon",
    label: "Utfyllende opplysninger",
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
    label: "Merknad",
    type: "text",
    required: false,
  },
  {
    name: "vurderingId",
    label: "Vurdering",
    type: "number",
    required: false,
    type: "vurderingselect",
  },
  {
    name: "statusId",
    label: "Status",
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
];
