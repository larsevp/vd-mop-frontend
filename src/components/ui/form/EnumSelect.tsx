import React from "react";
import { ComboBox, ComboBoxOption } from "./ComboBox";

interface EnumTranslation {
  [key: string]: string;
}

interface EnumSelectProps {
  name?: string;
  label?: string;
  value?: string | null;
  onChange: (event: { target: { name?: string; value: string | null; type: string } }) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  enumValues: string[];
  translations: EnumTranslation;
  excludeValues?: string[];
}

export function EnumSelect({
  name,
  label = "Select option",
  value,
  onChange,
  placeholder = "Select...",
  required = false,
  disabled = false,
  allowEmpty = true,
  emptyLabel = "None",
  className = "",
  enumValues = [],
  translations = {},
  excludeValues = [],
}: EnumSelectProps) {
  // Filter out excluded values and create options
  const options: ComboBoxOption[] = React.useMemo(() => {
    return enumValues
      .filter((enumValue) => !excludeValues.includes(enumValue))
      .map((enumValue) => ({
        id: enumValue,
        label: translations[enumValue] || enumValue,
      }));
  }, [enumValues, translations, excludeValues]);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      className={className}
      allowEmpty={allowEmpty}
      emptyLabel={emptyLabel}
      options={options}
      isLoading={false}
      error={null}
    />
  );
}

// Predefined translations for common enums
export const kravStatusTranslations: EnumTranslation = {
  draft: "Kladd",
  baseline: "Gjeldende versjon",
  changed: "Endret",
  deprecated: "Utgår",
};

// KravStatus specific component
export function KravStatusSelect({
  name = "kravStatus",
  label = "Status",
  value,
  onChange,
  required = false,
  disabled = false,
  className = "",
  allowEmpty = true,
}: Omit<EnumSelectProps, "enumValues" | "translations" | "excludeValues">) {
  return (
    <EnumSelect
      name={name}
      label={label}
      value={value}
      onChange={onChange}
      placeholder="Velg status..."
      required={required}
      disabled={disabled}
      className={className}
      allowEmpty={allowEmpty}
      emptyLabel="Ingen status"
      enumValues={["draft", "baseline", "changed", "deprecated"]}
      translations={kravStatusTranslations}
      excludeValues={["changed"]} // Exclude "changed" as requested
    />
  );
}
