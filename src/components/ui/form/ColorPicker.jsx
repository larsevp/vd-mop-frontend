import React, { useState, useRef, useEffect } from "react";
import { GithubPicker } from "react-color";
import { cn } from "@/lib/utils";

/**
 * ColorPicker component using react-color's GithubPicker
 * Features:
 * - GitHub-style color picker interface
 * - Displays selected color as a square before the input
 * - Click to open/close picker
 * - Supports hex color format (#f59e0b)
 */
export default function ColorPicker({
  name,
  value,
  onChange,
  error,
  placeholder = "Velg farge...",
  colors = [
    // Row 1: Strong primary colors
    "#EF4444",
    "#F97316",
    "#EAB308",
    "#22C55E",
    "#06B6D4",
    "#3B82F6",
    "#6366F1",
    "#8B5CF6",
    // Row 2: Deeper variants for better contrast
    "#DC2626",
    "#EA580C",
    "#CA8A04",
    "#16A34A",
    "#0891B2",
    "#2563EB",
    "#4F46E5",
    "#7C3AED",
    // Row 3: Dark colors for high contrast
    "#991B1B",
    "#C2410C",
    "#A16207",
    "#15803D",
    "#164E63",
    "#1E40AF",
    "#3730A3",
    "#5B21B6",
    // Row 4: Neutral and accent colors
    "#374151",
    "#6B7280",
    "#9CA3AF",
    "#F59E0B",
    "#10B981",
    "#0D9488",
    "#7C2D12",
    "#BE185D",
  ],
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef(null);
  const triggerRef = useRef(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleColorChange = (color) => {
    // react-color returns color object with hex property
    const hexValue = color.hex;

    // Create a synthetic event object for compatibility with form handling
    const syntheticEvent = {
      target: {
        name,
        value: hexValue,
        type: "text",
      },
    };

    onChange(syntheticEvent);
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    onChange(e);
  };

  const togglePicker = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Color input with color square */}
      <div
        ref={triggerRef}
        className={cn("flex items-center gap-2 cursor-pointer", "input-base", error ? "input-error" : "input-default")}
        onClick={togglePicker}
      >
        {/* Color square */}
        <div
          className="w-6 h-6 rounded border border-gray-300 flex-shrink-0"
          style={{
            backgroundColor: value || "#ffffff",
            boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.1)",
          }}
        />

        {/* Text input */}
        <input
          type="text"
          name={name}
          value={value || ""}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 outline-none border-none bg-transparent"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Color picker popover */}
      {isOpen && (
        <div ref={pickerRef} className="absolute top-full left-0 mt-2 z-50 bg-white rounded-lg shadow-lg border" style={{ zIndex: 9999 }}>
          <GithubPicker color={value || "#ffffff"} onChange={handleColorChange} colors={colors} triangle="top-left" />
        </div>
      )}
    </div>
  );
}
