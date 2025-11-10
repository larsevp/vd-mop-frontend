/**
 * Priority Configuration - Single source of truth for priority levels
 *
 * Centralizes priority level definitions, icons, colors, and logic.
 * Used across all components that display or select priority values.
 */

import { Triangle } from "lucide-react";

/**
 * Priority level configuration
 * Each level has: label, numeric value, threshold, icon, color, and rotation
 */
export const PRIORITY_CONFIG = {
  høy: {
    label: "Høy",
    value: 35, // Default value for form selection
    threshold: 30, // Numeric values >= 30 are "høy"
    icon: Triangle, // Component reference for direct use
    iconName: "Triangle", // String name for serialization
    iconRotation: "rotate-0", // ▲ pointing up
    color: "#dc2626", // Tailwind red-600
    textColor: "text-red-600",
    bgColor: "bg-red-50",
  },
  middels: {
    label: "Middels",
    value: 25,
    threshold: 20, // Numeric values >= 20 and < 30 are "middels"
    icon: Triangle,
    iconName: "Triangle",
    iconRotation: "rotate-90", // ▶ pointing right
    color: "#d97706", // Tailwind orange-600
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
  },
  lav: {
    label: "Lav",
    value: 15,
    threshold: 0, // Numeric values < 20 are "lav"
    icon: Triangle,
    iconName: "Triangle",
    iconRotation: "rotate-180", // ▼ pointing down
    color: "#059669", // Tailwind green-600
    textColor: "text-green-600",
    bgColor: "bg-green-50",
  },
};

/**
 * Get priority level configuration based on numeric value
 * @param {number} prioritetValue - Numeric priority value (e.g., 25, 32, 10)
 * @returns {Object} Priority configuration object (høy, middels, or lav)
 */
export const getPriorityLevel = (prioritetValue) => {
  const value = prioritetValue || 0;
  if (value >= PRIORITY_CONFIG.høy.threshold) return PRIORITY_CONFIG.høy;
  if (value >= PRIORITY_CONFIG.middels.threshold) return PRIORITY_CONFIG.middels;
  return PRIORITY_CONFIG.lav;
};

/**
 * Get priority display information for an entity
 * @param {Object} entity - Entity with prioritet field
 * @returns {Object|null} Display info with text, color, icon, rotation, or null if no priority
 */
export const getPriorityDisplay = (entity) => {
  if (!entity || entity.prioritet === null || entity.prioritet === undefined) {
    return null;
  }

  const config = getPriorityLevel(entity.prioritet);
  return {
    text: config.label,
    color: config.color,
    textColor: config.textColor,
    bgColor: config.bgColor,
    icon: config.icon,
    iconRotation: config.iconRotation,
    level: config === PRIORITY_CONFIG.høy ? "høy" : config === PRIORITY_CONFIG.middels ? "middels" : "lav",
  };
};

/**
 * Get priority icon component and rotation for a given level
 * @param {string} level - Priority level ("høy", "middels", "lav")
 * @returns {Object} Icon component and rotation class { icon, rotation }
 */
export const getPriorityIcon = (level) => {
  const config = PRIORITY_CONFIG[level];
  return config ? { icon: config.icon, rotation: config.iconRotation, color: config.color } : null;
};

/**
 * Get all priority options for form selects
 * @returns {Array} Array of priority options with label, value, icon, color, rotation
 */
export const getPriorityOptions = () => {
  return [
    {
      label: PRIORITY_CONFIG.høy.label,
      value: PRIORITY_CONFIG.høy.value,
      icon: PRIORITY_CONFIG.høy.icon,
      iconRotation: PRIORITY_CONFIG.høy.iconRotation,
      color: PRIORITY_CONFIG.høy.color,
      level: "høy",
    },
    {
      label: PRIORITY_CONFIG.middels.label,
      value: PRIORITY_CONFIG.middels.value,
      icon: PRIORITY_CONFIG.middels.icon,
      iconRotation: PRIORITY_CONFIG.middels.iconRotation,
      color: PRIORITY_CONFIG.middels.color,
      level: "middels",
    },
    {
      label: PRIORITY_CONFIG.lav.label,
      value: PRIORITY_CONFIG.lav.value,
      icon: PRIORITY_CONFIG.lav.icon,
      iconRotation: PRIORITY_CONFIG.lav.iconRotation,
      color: PRIORITY_CONFIG.lav.color,
      level: "lav",
    },
  ];
};
