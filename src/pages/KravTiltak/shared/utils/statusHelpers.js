/**
 * Status utility functions for KravTiltak domain
 * Used by ProsjektKrav and ProsjektTiltak entities
 */

import { Triangle } from "lucide-react";
import { getPriorityLevel } from "../config/priorityConfig";

/**
 * Get status display configuration
 * @param {Object} entity - Entity with status property
 * @returns {Object|null} Status display config with text, color, icon
 */
export const getStatusDisplay = (entity) => {
  if (!entity.status) return null;
  return {
    text: entity.status.navn,
    color: entity.status.color || "#6b7280",
    icon: entity.status.icon || 'CheckCircle',
  };
};

/**
 * Get vurdering (assessment) display configuration
 * @param {Object} entity - Entity with vurdering property
 * @returns {Object|null} Vurdering display config with text, color, icon
 */
export const getVurderingDisplay = (entity) => {
  if (!entity.vurdering) return null;
  return {
    text: entity.vurdering.navn,
    color: entity.vurdering.color || "#6b7280",
    icon: entity.vurdering.icon || 'Star',
  };
};

/**
 * Get prioritet (priority) display configuration
 * @param {Object} entity - Entity with prioritet property
 * @returns {Object|null} Prioritet display config with text, color, icon, rotation
 */
export const getPrioritetDisplay = (entity) => {
  if (!entity || entity.prioritet === null || entity.prioritet === undefined) {
    return null;
  }

  const config = getPriorityLevel(entity.prioritet);

  return {
    text: config.label,
    color: config.color,
    icon: config.iconName, // Use iconName from centralized config
    iconRotation: config.iconRotation,
  };
};