import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/primitives/button";

/**
 * Reusable "Opprett Krav" button component
 * Used in both single Krav workspace and combined workspaces
 *
 * @param {Function} onClick - Handler for create button click
 * @param {string} label - Button label (defaults to "Opprett Krav")
 */
export const KravCreateButton = ({ onClick, label = "Opprett Krav" }) => {
  return (
    <Button
      onClick={onClick}
      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all"
    >
      <Plus className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};

/**
 * Reusable "Opprett Tiltak" button component
 * Used in both single Tiltak workspace and combined workspaces
 *
 * @param {Function} onClick - Handler for create button click
 * @param {string} label - Button label (defaults to "Opprett Tiltak")
 */
export const TiltakCreateButton = ({ onClick, label = "Opprett Tiltak" }) => {
  return (
    <Button
      onClick={onClick}
      className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow transition-all"
    >
      <Plus className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};

/**
 * Reusable "Opprett ProsjektKrav" button component
 * Used in ProsjektKrav workspace and combined project workspaces
 *
 * @param {Function} onClick - Handler for create button click
 * @param {string} label - Button label (defaults to "Opprett ProsjektKrav")
 */
export const ProsjektKravCreateButton = ({ onClick, label = "Opprett ProsjektKrav" }) => {
  return (
    <Button
      onClick={onClick}
      className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all"
    >
      <Plus className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};

/**
 * Reusable "Opprett ProsjektTiltak" button component
 * Used in ProsjektTiltak workspace and combined project workspaces
 *
 * @param {Function} onClick - Handler for create button click
 * @param {string} label - Button label (defaults to "Opprett ProsjektTiltak")
 */
export const ProsjektTiltakCreateButton = ({ onClick, label = "Opprett ProsjektTiltak" }) => {
  return (
    <Button
      onClick={onClick}
      className="bg-sky-600 hover:bg-sky-700 text-white shadow-sm hover:shadow transition-all"
    >
      <Plus className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );
};
