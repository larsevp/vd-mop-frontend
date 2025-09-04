/**
 * Tiltak Model Query Functions
 * Contains all API endpoint functions for tiltak operations
 */

import {
  getTiltak,
  deleteTiltak,
  createTiltak,
  updateTiltak,
  getPaginatedTiltak,
  getPaginatedTiltakAll,
  getPaginatedTiltakGroupedByEmne,
  getTiltakById,
} from "@/api/endpoints";

export const queryFunctions = {
  queryKey: ["tiltak"],
  queryFn: getPaginatedTiltak,
  queryFnAll: getPaginatedTiltakAll, // Get all fields including rich text content
  queryFnGroupedByEmne: getPaginatedTiltakGroupedByEmne, // Get Tiltak grouped by Emne
  getByIdFn: getTiltakById,
  createFn: createTiltak,
  updateFn: updateTiltak,
  deleteFn: deleteTiltak,
};