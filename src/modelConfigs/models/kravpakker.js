import {
  getKravpakker,
  deleteKravpakker,
  createKravpakker,
  updateKravpakker,
  getPaginatedKravpakker,
  getKravpakkerById,
} from "@/api/endpoints";

export const kravpakker = {
  queryKey: ["kravpakker"],
  queryFn: getPaginatedKravpakker,
  getByIdFn: getKravpakkerById,
  createFn: createKravpakker,
  updateFn: updateKravpakker,
  deleteFn: deleteKravpakker,
  title: "Kravpakker", //tittel på rowIndex og kort
  desc: "Definer navn på kravpakker som kan knyttes opp mot forskjellige krav",
  modelPrintName: "Kravpakke", //entall
  newButtonLabelText: "Ny kravpakke",
  fields: [
    {
      name: "tittel",
      label: "Tittel",
      type: "text",
      required: true,
    },
    {
      name: "beskrivelse",
      label: "Beskrivelse",
      type: "text",
      required: false,
    },
    {
      name: "enhetId",
      label: "EnhetId",
      type: "enhetselect",
      required: true,
    },
    {
      name: "createdBy",
      label: "CreatedBy",
      type: "userselect",
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
    },
    {
      name: "updatedBy",
      label: "UpdatedBy",
      type: "userselect",
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
    },
  ],
};
