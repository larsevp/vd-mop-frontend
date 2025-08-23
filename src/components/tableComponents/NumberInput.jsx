import React from "react";

/**
 * NumberInput component with better UX and validation
 * Features:
 * - Proper number validation
 * - Min/max constraints
 * - Step support for decimals
 * - Better empty value handling
 * - Cleaner styling
 */
export default function NumberInput({
  name,
  value,
  onChange,
  label,
  required = false,
  min,
  max,
  step = 1,
  placeholder = "",
  className = "",
  integer = false, // Force integer values only
  hasError = false, // External error state from parent form
}) {
  const [inputValue, setInputValue] = React.useState(value?.toString() || "");
  const [isValid, setIsValid] = React.useState(true);
  const [errorMessage, setErrorMessage] = React.useState("");

  // Update local state when prop value changes
  React.useEffect(() => {
    setInputValue(value?.toString() || "");
  }, [value]);

  function validateNumber(val) {
    if (val === "") {
      return { valid: !required, error: required ? "Dette feltet er påkrevet" : "" };
    }

    // Check if input contains invalid characters for numbers
    if (!/^-?\d*\.?\d*$/.test(val)) {
      return { valid: false, error: "Kun tall er tillatt. Ingen bokstaver eller spesialtegn." };
    }

    // Check for incomplete input like just "-" or "."
    if (val === "-" || val === ".") {
      return { valid: false, error: "Ufullstendig tall" };
    }

    const num = parseFloat(val);

    if (isNaN(num)) {
      return { valid: false, error: "Må være et gyldig tall" };
    }

    if (integer && !Number.isInteger(num)) {
      return { valid: false, error: "Må være et helt tall (ingen desimaler)" };
    }

    if (min !== undefined && num < min) {
      return { valid: false, error: `Må være minst ${min}` };
    }

    if (max !== undefined && num > max) {
      return { valid: false, error: `Må være maks ${max}` };
    }

    return { valid: true, error: "" };
  }

  function handleChange(e) {
    const newValue = e.target.value;

    // Allow empty value
    if (newValue === "") {
      setInputValue("");
      const validation = validateNumber("");
      setIsValid(validation.valid);
      setErrorMessage(validation.error);
      onChange({
        target: { name, value: null, type: "number" },
      });
      return;
    }

    // Check for invalid characters BEFORE filtering to show error
    const hasInvalidChars = /[^0-9.-]/.test(newValue);
    if (hasInvalidChars) {
      setIsValid(false);
      setErrorMessage("Kun tall er tillatt. Ingen bokstaver eller spesialtegn.");
      return; // Don't update the input value
    }

    // Filter out any remaining invalid characters (just in case)
    const filteredValue = newValue.replace(/[^0-9.-]/g, "");

    // Prevent multiple decimal points
    const decimalCount = (filteredValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      setIsValid(false);
      setErrorMessage("Kun ett desimaltegn er tillatt.");
      return;
    }

    // Prevent multiple minus signs or minus not at start
    const minusIndex = filteredValue.indexOf("-");
    if (minusIndex > 0 || (filteredValue.match(/-/g) || []).length > 1) {
      setIsValid(false);
      setErrorMessage("Minustegn kan kun være i starten.");
      return;
    }

    // Prevent decimal point in integer mode
    if (integer && filteredValue.includes(".")) {
      setIsValid(false);
      setErrorMessage("Hele tall kun - ingen desimaler tillatt.");
      return;
    }

    setInputValue(filteredValue);

    const validation = validateNumber(filteredValue);
    setIsValid(validation.valid);
    setErrorMessage(validation.error);

    // Only call onChange with valid numbers
    if (validation.valid && filteredValue !== "") {
      const numValue = integer ? parseInt(filteredValue) : parseFloat(filteredValue);
      onChange({
        target: {
          name,
          value: numValue,
          type: "number",
        },
      });
    } else if (filteredValue === "") {
      onChange({
        target: { name, value: null, type: "number" },
      });
    }
  }

  function handleKeyPress(e) {
    // This is now mainly for user feedback - actual filtering happens in onChange
    if (e.ctrlKey || e.metaKey || ["Backspace", "Delete", "Tab", "Enter", "ArrowLeft", "ArrowRight"].includes(e.key)) {
      return;
    }

    // Allow numbers
    if (/\d/.test(e.key)) {
      return;
    }

    // Allow decimal point if not integer mode
    if (!integer && e.key === ".") {
      return;
    }

    // Allow minus sign at the beginning
    if (e.key === "-") {
      return;
    }

    // For other characters, show immediate feedback but don't prevent (onChange will handle it)
    if (!/[0-9.-]/.test(e.key)) {
      // Quick visual feedback
      setIsValid(false);
      setErrorMessage("Kun tall tillatt");
    }
  }

  function handleBlur() {
    // On blur, if we have a valid partial number, format it properly
    if (inputValue && !isNaN(parseFloat(inputValue))) {
      const num = integer ? parseInt(inputValue) : parseFloat(inputValue);
      if (validateNumber(num.toString()).valid) {
        setInputValue(num.toString());
      }
    }
  }

  return (
    <div className={className}>
      <input
        type="text"
        name={name}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        onKeyPress={handleKeyPress}
        placeholder={placeholder}
        inputMode="numeric"
        pattern="[0-9]*"
        className={`input-base ${!isValid || hasError ? "input-error" : "input-default"}`}
        required={required}
      />
      {!isValid && errorMessage && (
        <div className="mt-1 flex items-center text-sm text-error-600">
          <svg className="w-4 h-4 mr-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
