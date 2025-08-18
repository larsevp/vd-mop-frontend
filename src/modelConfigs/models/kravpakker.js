import {
  getKravpakker,
  deleteKravpakker,
  createKravpakker,
  updateKravpakker,
  getPaginatedKravpakker,
  getKravpakkerById,
} from "@/api/endpoints";

export const kravpakkerModel = {
  queryKey: ["kravpakker"],
  queryFn: getPaginatedKravpakker,
  getByIdFn: getKravpakkerById,
  createFn: createKravpakker,
  updateFn: updateKravpakker,
  deleteFn: deleteKravpakker,
  modelPrintName: "kravpakker",
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
