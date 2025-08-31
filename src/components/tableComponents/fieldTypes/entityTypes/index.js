// Barrel export for all entity field types
import { globalSelectTypes } from "./globalSelects";
import { emneSelectType } from "./emneSelect";
import { entityRelationshipSelects } from "./entityRelationshipSelects";
import { multiselectType } from "./multiselect";

// Export configuration separately for potential reuse
export { MULTISELECT_ENTITY_CONFIG } from "./config";

// Combine all field types into a single object
export const ENTITY_FIELD_TYPES = {
  ...globalSelectTypes,
  ...emneSelectType,
  ...entityRelationshipSelects,
  ...multiselectType,
};

// Debug: Log available field types
//console.log("🔍 Available ENTITY_FIELD_TYPES:", Object.keys(ENTITY_FIELD_TYPES));
