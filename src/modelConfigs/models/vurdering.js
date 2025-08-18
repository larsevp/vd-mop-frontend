import {
  getVurderinger,
  deleteVurdering,
  createVurdering,
  updateVurdering,
  getPaginatedVurdering,
  getVurderingById,
} from "@/api/endpoints";

export const vurderingModel = {
  queryKey: ["vurderinger"],
  queryFn: getPaginatedVurdering,
  getByIdFn: getVurderingById,
  createFn: createVurdering,
  updateFn: updateVurdering,
  deleteFn: deleteVurdering,
  modelPrintName: "vurdering",
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
