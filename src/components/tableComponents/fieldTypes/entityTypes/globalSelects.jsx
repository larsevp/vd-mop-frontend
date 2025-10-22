import React from "react";
import { StatusSelect } from "../../../ui/form/StatusSelect";
import { VurderingSelect } from "../../../ui/form/VurderingSelect";
import { KravreferansetypeSelect } from "../../../ui/form/Kravreferansetype";
import { PrioritetSelect } from "../../../ui/form/PrioritetSelect";
import { KravStatusSelect } from "../../../ui/form/EnumSelect";
import EnhetSelect from "../../EnhetSelect";
import FagomradeSelect from "../../FagomradeSelect";

// Global entity selects (can be used in any model)
export const globalSelectTypes = {
  statusselect: ({ field, value, onChange, error }) => (
    <StatusSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  vurderingselect: ({ field, value, onChange, error }) => (
    <VurderingSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  kravreferansetypeselect: ({ field, value, onChange, error }) => (
    <KravreferansetypeSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  prioritetselect: ({ field, value, onChange, error }) => (
    <PrioritetSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  kravstatusselect: ({ field, value, onChange, error }) => (
    <KravStatusSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  enhetselect: ({ field, value, onChange, error }) => (
    <EnhetSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),

  fagomradeselect: ({ field, value, onChange, error }) => (
    <FagomradeSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      placeholder={field.placeholder}
    />
  ),
};