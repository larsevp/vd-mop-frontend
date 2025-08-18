import { getEmner, deleteEmne, createEmne, updateEmne, getPaginatedEmne, getEmneById } from "@/api/endpoints";

export const emneModel = {
  queryKey: ["emner"],
  queryFn: getPaginatedEmne,
  getByIdFn: getEmneById,
  createFn: createEmne,
  updateFn: updateEmne,
  deleteFn: deleteEmne,
  modelPrintName: "emne",
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
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
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
