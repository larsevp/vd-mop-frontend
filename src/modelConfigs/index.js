// Re-export all model configurations
export { userModel } from "./models/user";
export { prosjektModel } from "./models/prosjekt";
export { enhetModel } from "./models/enhet";
export { emneModel } from "./models/emne";
export { statusModel } from "./models/status";
export { vurderingModel } from "./models/vurdering";
export { kravpakkerModel } from "./models/kravpakker";

// Create modelConfigs object for backward compatibility
import { userModel } from "./models/user";
import { prosjektModel } from "./models/prosjekt";
import { enhetModel } from "./models/enhet";
import { emneModel } from "./models/emne";
import { statusModel } from "./models/status";
import { vurderingModel } from "./models/vurdering";
import { kravpakkerModel } from "./models/kravpakker";

export const modelConfigs = {
  users: userModel,
  prosjekter: prosjektModel,
  enheter: enhetModel,
  emner: emneModel,
  status: statusModel,
  vurderinger: vurderingModel,
  kravpakker: kravpakkerModel,
};

// Helper function to get config by model type
export function getModelConfig(modelType) {
  return modelConfigs[modelType];
}
