/**
 * Converts boolean values to Norwegian "Ja/Nei" text
 * @param value - The boolean value to convert
 * @param nullText - Text to display for null/undefined values (default: "")
 * @returns "Ja" for true, "Nei" for false, nullText for null/undefined
 */
export function booleanToJaNei(value: boolean | null | undefined, nullText: string = ""): string {
  if (value === true) return "Ja";
  if (value === false) return "Nei";
  return nullText;
}

/**
 * Converts "Ja/Nei" text back to boolean values
 * @param text - The text to convert
 * @returns true for "Ja", false for "Nei", null for anything else
 */
export function jaNeireToBoolean(text: string): boolean | null {
  if (text === "Ja") return true;
  if (text === "Nei") return false;
  return null;
}
