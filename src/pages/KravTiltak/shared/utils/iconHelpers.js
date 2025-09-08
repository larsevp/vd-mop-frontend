import { CheckCircle, Star, AlertTriangle, AlertCircle, Circle, Check } from "lucide-react";

/**
 * Icon utility functions for KravTiltak domain
 * Centralized icon mapping for all KravTiltak entities
 */

// Centralized icon mapping - single source of truth
const ICON_MAP = {
  CheckCircle: CheckCircle,
  Star: Star,
  AlertTriangle: AlertTriangle,
  AlertCircle: AlertCircle,
  Circle: Circle,
  Check: Check,
};

/**
 * Get Lucide icon component class by name
 * @param {string} iconName - Name of the icon
 * @returns {React.ComponentType|null} Icon component class or null if not found
 */
export const getIconComponent = (iconName) => {
  return ICON_MAP[iconName] || null;
};

