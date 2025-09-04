/**
 * Krav Model Query Functions
 * Contains all API endpoint functions for krav operations
 */

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

export const queryFunctions = {
  queryKey: ["krav"],
  queryFn: getPaginatedKrav,
  queryFnAll: getPaginatedKravAll, // Get all fields including "informasjon"
  queryFnGroupedByEmne: getPaginatedKravGroupedByEmne, // Get Krav grouped by Emne
  getByIdFn: getKravById,
  createFn: createKrav,
  updateFn: updateKrav,
  deleteFn: deleteKrav,
};