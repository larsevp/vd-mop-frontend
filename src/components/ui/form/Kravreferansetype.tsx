import React from "react";
import { getKravreferanseTyperSimple as getKravreferanseTyper } from "@/api/endpoints/models/kravreferansetype";
import { EntitySelect } from "./EntitySelect";
import EntityCheckboxGroup from "./EntityCheckboxGroup";

interface KravreferansetypeSelectProps {
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

interface KravreferansetypeCheckboxGroupProps {
  label?: string;
  selectedValues: number[];
  onChange: (values: number[]) => void;
  disabled?: boolean;
  className?: string;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

export function KravreferansetypeSelect(props: KravreferansetypeSelectProps) {
  return (
    <EntitySelect
      {...props}
      label={props.label || "Kravreferansetype"}
      placeholder={props.placeholder || "Velg referanse..."}
      emptyLabel={props.emptyLabel || "Ingen referanse"}
      entityName="Kravreferansetype"
      queryKey={["kravreferansetype"]}
      queryFn={getKravreferanseTyper}
      displayField="tittel"
      sortField="tittel"
    />
  );
}

export function KravreferansetypeCheckboxGroup({
  label = "Kravreferansetype",
  layout = "vertical",
  ...props
}: KravreferansetypeCheckboxGroupProps) {
  return (
    <EntityCheckboxGroup
      {...props}
      label={label}
      queryKey={["kravreferansetype"]}
      queryFn={getKravreferanseTyper}
      displayField="tittel"
      sortField="tittel"
      layout={layout}
    />
  );
}
