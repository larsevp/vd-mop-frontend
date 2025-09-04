/**
 * Tiltak Model Barrel Export
 * Combines metadata, queryFunctions, workspaceConfig, and fields
 */

import { metadata } from "./metadata.js";
import { queryFunctions } from "./queryFunctions.js";
import { workspaceConfig } from "./workspaceConfig.js";
import { fields } from "./fields.js";

export const tiltak = {
  ...queryFunctions,
  ...metadata,
  ...workspaceConfig,
  fields,
};