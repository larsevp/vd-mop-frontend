import { getUsers, deleteUser, createUser, updateUser } from '../api/endpoints';
import { getProsjekter, deleteProsjekt, createProsjekt, updateProsjekt } from '../api/endpoints';

// Centralized model configurations
export const modelConfigs = {
  users: {
    queryKey: ["users"],
    queryFn: getUsers,
    createFn: createUser,
    updateFn: updateUser,
    deleteFn: deleteUser,
    modelPrintName: 'bruker',
    fields: [
      { name: 'navn', label: 'Navn', type: 'text', required: true },
      { name: 'epost', label: 'E-post', type: 'email', required: true },
      { name: 'rolle', label: 'Rolle', type: 'select', required: true, options: [
        { value: 'user', label: 'User' },
        { value: 'admin', label: 'Admin' },
      ] },
      { name: 'enhetId', label: 'Enhet', type: 'enhetselect', required: true, placeholder: 'Velg enhet' },
    ]
  },
  prosjekter: {
    queryKey: ["prosjekter"],
    queryFn: getProsjekter,
    createFn: createProsjekt,
    updateFn: updateProsjekt,
    deleteFn: deleteProsjekt,
    modelPrintName: 'Prosjekt',
    fields: [
      { name: 'id', label: 'ID', type: 'number', hiddenIndex: true, hiddenEdit: true, hiddenCreate: true },
      { name: 'prosjektnummer', label: 'Prosjektnummer', type: 'number', hiddenIndex: false, hiddenEdit: false, hiddenCreate: false, integer: true, min: 1, placeholder: 'Skriv inn prosjektnummer' },
      { name: 'navn', label: 'Navn', required:true, type: 'text', hiddenIndex: false, hiddenEdit: false, hiddenCreate: false },
      { name: 'beskrivelse', label: 'Beskrivelse', type: 'text', hiddenIndex: false, hiddenEdit: false, hiddenCreate: false },
      { name: 'enhetId', label: 'Enhet', required:true, type: 'enhetselect', hiddenIndex: false, hiddenEdit: false, hiddenCreate: false, placeholder: 'Velg enhet' },
      { name: 'userId', label: 'User ID', type: 'number', hiddenIndex: true, hiddenEdit: true, hiddenCreate: true, integer: true, min: 1, placeholder: 'Velg bruker ID' },
      { name: 'createdBy', label: 'Created By', type: 'number', hiddenIndex: true, hiddenEdit: true, hiddenCreate: true },
      { name: 'updatedBy', label: 'Updated By', type: 'number', hiddenIndex: true, hiddenEdit: true, hiddenCreate: true },
    ]
  }
};

// Helper function to get config by model type
export function getModelConfig(modelType) {
  return modelConfigs[modelType];
}
