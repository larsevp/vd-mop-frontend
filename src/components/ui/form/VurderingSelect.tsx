import React from "react";
import { getVurderinger } from "../../../api/endpoints/models/vurdering";
import { EntitySelect } from "./EntitySelect";
import EntityCheckboxGroup from "./EntityCheckboxGroup";

interface VurderingSelectProps {
  name?: string;
  label?: string;
  value?: number | null;
  onChange: (event: { target: { name?: string; value: number | null; type: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
}

interface VurderingCheckboxGroupProps {
  label?: string;
  selectedValues: number[];
  onChange: (values: number[]) => void;
  disabled?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

export function VurderingSelect(props: VurderingSelectProps) {
  return (
    <EntitySelect
      {...props}
      label={props.label || "Vurdering"}
      placeholder={props.placeholder || "Velg vurdering..."}
      emptyLabel={props.emptyLabel || "Ingen vurdering"}
      entityName="Vurdering"
      queryKey={["vurderinger"]}
      queryFn={getVurderinger}
      displayField="navn"
      sortField="navn"
    />
  );
}

export function VurderingCheckboxGroup({ label = "Vurdering", layout = "vertical", ...props }: VurderingCheckboxGroupProps) {
  return (
    <EntityCheckboxGroup
      {...props}
      label={label}
      queryKey={["vurderinger"]}
      queryFn={getVurderinger}
      displayField="navn"
      sortField="navn"
      layout={layout}
    />
  );
}
