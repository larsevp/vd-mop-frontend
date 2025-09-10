// Dynamic model config access for generic components
/* PLOP_IMPORT_MODELS */
import { files } from "./models/files";
import { krav } from "./models/krav";
import { lov } from "./models/lov";
import { user } from "./models/user";
import { prosjekt } from "./models/prosjekt";
import { enhet } from "./models/enhet";
import { emne } from "./models/emne";
import { status } from "./models/status";
import { vurdering } from "./models/vurdering";
import { kravpakker } from "./models/kravpakker";
import { kravreferansetype } from "./models/kravreferansetype";
import { tiltak } from "./models/tiltak";
import { prosjektKrav } from "./models/prosjektKrav";
import { prosjektTiltak } from "./models/prosjektTiltak";
// Object mapping for dynamic lookup
export const modelConfigs = {
  /* PLOP_MODEL_MAPPINGS */
  files: files,
  krav: krav,
  lover: lov,
  users: user,
  prosjekter: prosjekt,
  enheter: enhet,
  emner: emne,
  status: status,
  vurderinger: vurdering,
  kravpakker: kravpakker,
  kravreferansetyper: kravreferansetype,
  tiltak: tiltak,
  prosjektKrav: prosjektKrav,
  prosjektTiltak: prosjektTiltak,
};

// Helper function for dynamic model config access
export function getModelConfig(modelType) {
  if (!Object.hasOwn(modelConfigs, modelType)) {
    throw new Error(`[getModelConfig function error] Model type "${modelType}" does not exist in modelConfigs.`);
  }
  return modelConfigs[modelType];
}

// Export workspace config utilities
export { transformWorkspaceConfig, validateWorkspaceConfig, createWorkspaceConfigBuilder } from "./utils/workspaceConfigTransform.js";
