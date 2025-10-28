// Generated model config for Lov
import { getLover, deleteLov, createLov, updateLov, getPaginatedLov, getLovById } from "@/api/endpoints";

export const lov = {
  queryKey: ["lover"],
  queryFn: getPaginatedLov,
  getByIdFn: getLovById,
  createFn: createLov,
  updateFn: updateLov,
  deleteFn: deleteLov,
  modelPrintName: "lov",
  title: "Lover",
  desc: "beskrivelse ...",
  modelPrintName: "lov",
  newButtonLabel: "Ny lov",
  fields: [
    { 
      name: "tittel", 
      label: "Tittel", 
      type: "text", 
      required: true
    },
    {
      name: "beskrivelse",
      label: "Beskrivelse",
      type: "textarea",
      required: false
    },
    { 
      name: "enhetId", 
      label: "EnhetId", 
      type: "number", 
      required: false,
      type: "enhetselect"
    },
    { 
      name: "createdBy", 
      label: "CreatedBy", 
      type: "number", 
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
      type: "userselect"
    },
    { 
      name: "updatedBy", 
      label: "UpdatedBy", 
      type: "number", 
      required: false,
      hiddenIndex: true,
      hiddenEdit: true,
      hiddenCreate: true,
      type: "userselect"
    }
  ],
};
