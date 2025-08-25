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
  modelPrintName: "krav",
  newButtonLabel: "Ny krav",
  fields: [
    {
      name: "kravUID",
      label: "Krav UID",
      type: "text",
      required: true,
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
      label: "KravreferansetypeID",
      type: "kravreferansetypeselect",
      required: false,
    },
    {
      name: "kravreferanse",
      label: "Kravreferanse",
      type: "text",
      placeholder: "Hvor kommer kravet fra?",
      required: false,
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
      label: "ParentId",
      type: "kravselect",
      required: false,
      field_info:
        "Velg et overordnet krav hvis dette kravet er et underkrav. Systemet forhindrer at krav med egne underkrav kan velges som foreldre for å unngå hierarkiproblemer.",
    },
    {
      name: "versjon",
      label: "Versjon",
      type: "text",
      required: true,
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
      label: "EmneId",
      type: "number",
      required: true,
      type: "emneselect",
    },
    {
      name: "enhetId",
      label: "EnhetId",
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
