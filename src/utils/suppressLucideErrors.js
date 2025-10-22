/**
 * Suppress specific console warnings and errors
 * - Lucide React dynamic icon errors (format conversion between PascalCase and kebab-case)
 * - react-color defaultProps warnings (third-party library deprecation)
 * These messages are expected and the functionality works correctly despite the warnings
 */

// Store the original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Log that the suppression is loaded
console.log("🔇 Console warning/error suppression loaded");

// Override console.error to filter out Lucide dynamic icon errors
console.error = (...args) => {
  // Check if this is a Lucide React dynamic icon error
  const firstArg = args[0];
  let errorMessage = "";

  // Handle both string messages and Error objects
  if (typeof firstArg === "string") {
    errorMessage = firstArg;
  } else if (firstArg instanceof Error) {
    errorMessage = firstArg.message;
  } else if (firstArg && firstArg.toString) {
    errorMessage = firstArg.toString();
  }

  // Check for various forms of the Lucide error message
  if (
    errorMessage.includes("[lucide-react]") &&
    (errorMessage.includes("Name in Lucide DynamicIcon not found") || errorMessage.includes("DynamicIcon not found"))
  ) {
    // Suppress this specific error - it's expected behavior with our format conversions
    console.log("🔇 Suppressed Lucide error:", errorMessage);
    return;
  }

  // Check for react-color defaultProps warnings that come through as errors
  if (
    (errorMessage.includes("defaultProps") || errorMessage.includes("Warning: Github2")) &&
    (errorMessage.includes("Github2") || errorMessage.includes("react-color") || errorMessage.includes("function components"))
  ) {
    // Suppress this warning - it's from a third-party library (react-color)
    return;
  }

  // For all other errors, use the original console.error
  originalConsoleError.apply(console, args);
};

// Override console.warn to filter out react-color defaultProps warnings
console.warn = (...args) => {
  // Check if this is a react-color defaultProps warning
  const firstArg = args[0];
  let warningMessage = "";

  // Handle both string messages and other types
  if (typeof firstArg === "string") {
    warningMessage = firstArg;
  } else if (firstArg && firstArg.toString) {
    warningMessage = firstArg.toString();
  }

  // Suppress react-color defaultProps warnings
  if (
    (warningMessage.includes("defaultProps") || warningMessage.includes("Warning: Github2")) &&
    (warningMessage.includes("Github2") || warningMessage.includes("react-color") || warningMessage.includes("function components"))
  ) {
    // Suppress this warning - it's from a third-party library (react-color)
    return;
  }

  // For all other warnings, use the original console.warn
  originalConsoleWarn.apply(console, args);
};

export default null; // This file doesn't export anything, it just sets up the override
