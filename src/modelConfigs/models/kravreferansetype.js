// Generated model config for KravreferanseType
import {
  getKravreferanseTyper,
  deleteKravreferanseType,
  createKravreferanseType,
  updateKravreferanseType,
  getPaginatedKravreferanseType,
  getKravreferanseTypeById,
} from "@/api/endpoints";

export const kravreferansetype = {
  queryKey: ["kravreferansetyper"],
  queryFn: getPaginatedKravreferanseType,
  getByIdFn: getKravreferanseTypeById,
  createFn: createKravreferanseType,
  updateFn: updateKravreferanseType,
  deleteFn: deleteKravreferanseType,
  modelPrintName: "kravreferansetype",
  title: "Type krav",
  desc: "Her kan du legge til type krav,- kontraktskrav, myndighetskrav etc.",
  modelPrintName: "kravreferansetype",
  newButtonLabel: "Ny type",
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
      type: "textarea",
      required: false,
    },
    {
      name: "enhetId",
      label: "EnhetId",
      type: "number",
      required: false,
      type: "enhetselect",
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
  ],
};
