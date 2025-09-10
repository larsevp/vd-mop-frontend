/**
 * Krav Model Configuration - Barrel Export
 * Combines all krav model configuration parts into a unified export
 */

import { metadata } from "./metadata.js";
import { queryFunctions } from "./queryFunctions.js";
import { workspaceConfig } from "./workspaceConfig.js";
import { fields } from "./fields.js";

// Combine all configuration parts
export const prosjektTiltak = {
  ...metadata,
  ...queryFunctions,
  ...workspaceConfig,
  fields,
};
