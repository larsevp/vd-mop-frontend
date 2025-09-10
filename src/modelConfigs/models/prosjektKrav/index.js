/**
 * ProsjektKrav Model Configuration - Barrel Export
 * Combines all prosjektKrav model configuration parts into a unified export
 */

import { metadata } from "./metadata.js";
import { prosjektKrav as queryFunctions } from "./queryFunctions.js";
import { workspaceConfig } from "./workspaceConfig.js";
import { fields } from "./fields.js";

// Combine all configuration parts
export const prosjektKrav = {
  ...metadata,
  ...queryFunctions,
  ...workspaceConfig,
  fields,
};
