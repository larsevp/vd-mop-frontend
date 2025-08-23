import React from "react";
import { getStatus } from "../../../api/endpoints/models/status";
import { EntitySelect } from "./EntitySelect";
import EntityCheckboxGroup from "./EntityCheckboxGroup";

interface StatusSelectProps {
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

interface StatusCheckboxGroupProps {
  label?: string;
  selectedValues: number[];
  onChange: (values: number[]) => void;
  disabled?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

export function StatusSelect(props: StatusSelectProps) {
  return (
    <EntitySelect
      {...props}
      label={props.label || "Status"}
      placeholder={props.placeholder || "Velg status..."}
      emptyLabel={props.emptyLabel || "Ingen status"}
      entityName="Status"
      queryKey={["status"]}
      queryFn={getStatus}
      displayField="navn"
      sortField="sortIt"
    />
  );
}

export function StatusCheckboxGroup({ label = "Status", layout = "vertical", ...props }: StatusCheckboxGroupProps) {
  return (
    <EntityCheckboxGroup
      {...props}
      label={label}
      queryKey={["status"]}
      queryFn={getStatus}
      displayField="navn"
      sortField="sortIt"
      layout={layout}
    />
  );
}
