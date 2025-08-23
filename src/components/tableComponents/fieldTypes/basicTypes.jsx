// Basic field type components that work across all models
import React from "react";
import { BooleanSelect } from "@/components/ui/form/BooleanSelect";
import NumberInput from "../NumberInput";

export const BASIC_FIELD_TYPES = {
  text: ({ field, value, onChange, error }) => (
    <input
      type="text"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  textarea: ({ field, value, onChange, error }) => (
    <textarea
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      rows={field.rows || 3}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  number: ({ field, value, onChange, error }) => (
    <NumberInput
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      min={field.min}
      max={field.max}
      step={field.step}
      integer={field.integer}
      placeholder={field.placeholder}
      hasError={!!error}
    />
  ),

  bool: ({ field, value, onChange, error }) => (
    <BooleanSelect
      name={field.name}
      value={value}
      onChange={onChange}
      label={field.label}
      required={field.required}
      defaultValue={field.default}
      placeholder={field.placeholder}
    />
  ),

  select: ({ field, value, onChange, error }) => (
    <select
      name={field.name}
      value={value || ""}
      onChange={onChange}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    >
      {field.options?.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  ),

  email: ({ field, value, onChange, error }) => (
    <input
      type="email"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  password: ({ field, value, onChange, error }) => (
    <input
      type="password"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      placeholder={field.placeholder}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  date: ({ field, value, onChange, error }) => (
    <input
      type="date"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),

  datetime: ({ field, value, onChange, error }) => (
    <input
      type="datetime-local"
      name={field.name}
      value={value || ""}
      onChange={onChange}
      className={`input-base ${error ? "input-error" : "input-default"}`}
      required={field.required}
    />
  ),
};
