import { getStatus, deleteStatus, createStatus, updateStatus, getPaginatedStatus, getStatusById } from "@/api/endpoints";

export const statusModel = {
  queryKey: ["status"],
  queryFn: getPaginatedStatus,
  getByIdFn: getStatusById,
  createFn: createStatus,
  updateFn: updateStatus,
  deleteFn: deleteStatus,
  modelPrintName: "status",
  fields: [
    {
      name: "navn",
      label: "Navn",
      type: "text",
      required: true,
    },
    {
      name: "sortIt",
      label: "Rekkefølge",
      type: "number",
      required: true,
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
