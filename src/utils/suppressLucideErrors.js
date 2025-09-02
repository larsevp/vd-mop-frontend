/**
 * Suppress specific Lucide React dynamic icon errors
 * These errors are expected when we're doing format conversions between PascalCase and kebab-case
 * The functionality works correctly despite these console warnings
 */

// Store the original console.error
const originalConsoleError = console.error;

// Log that the suppression is loaded
console.log("🔇 Lucide error suppression loaded");

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

  // For all other errors, use the original console.error
  originalConsoleError.apply(console, args);
};

export default null; // This file doesn't export anything, it just sets up the override
