import React, { useState, useRef, useEffect } from "react";
import { AlertTriangle, Zap, ArrowUp, ChevronDown } from "lucide-react";
import { PRIORITY_OPTIONS } from "@/components/ui/form/PrioritetSelect.tsx";

/**
 * PrioritetDropdown component that displays current priority as a badge and opens dropdown on click
 * Uses a custom dropdown implementation for better control
 */
const PrioritetDropdown = ({ value, onChange, loading = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Create options array with null option for "no priority"
  const allOptions = [
    { id: null, label: "Ikke satt", icon: AlertTriangle, color: "#6b7280" },
    ...PRIORITY_OPTIONS.map((priority) => ({
      id: priority.value,
      label: priority.label,
      icon: priority.value === 15 ? AlertTriangle : priority.value === 25 ? Zap : ArrowUp,
      color:
        priority.value === 15
          ? "#10b981" // Green for low
          : priority.value === 25
          ? "#f59e0b" // Amber for medium
          : "#ef4444", // Red for high
    })),
  ];

  const currentPrioritet = allOptions.find((opt) => opt.id === value) || allOptions[0];
  const IconComponent = currentPrioritet.icon;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleToggle = (e) => {
    e.stopPropagation(); // Prevent card click
    if (!loading) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionSelect = async (option) => {
    if (loading || !onChange) return;

    setIsOpen(false);

    try {
      await onChange(option.id);
    } catch (error) {
      console.error("Prioritet change failed:", error);
    }
  };

  // Prevent all clicks within the dropdown from bubbling to parent
  const handleDropdownClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef} onClick={handleDropdownClick}>
      {/* Trigger Badge */}
      <button
        ref={buttonRef}
        onClick={handleToggle}
        disabled={loading}
        className={`
          text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 transition-all duration-200
          bg-transparent border border-gray-300 text-gray-700 hover:border-gray-400
          ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:scale-105"}
          shadow-sm hover:shadow-md
        `}
        type="button"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
        ) : (
          <IconComponent size={11} style={{ color: currentPrioritet.color }} />
        )}
        <span>{currentPrioritet.label}</span>
        {!loading && <ChevronDown size={10} className={`opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !loading && (
        <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 whitespace-nowrap max-h-60 overflow-y-auto min-w-full">
          {allOptions.map((option) => {
            const OptionIcon = option.icon;
            const isSelected = option.id === value;

            return (
              <button
                key={option.id || "null"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionSelect(option);
                }}
                className={`
                  w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 transition-colors
                  ${isSelected ? "bg-blue-50 text-blue-700" : "text-gray-700"}
                  first:rounded-t-lg last:rounded-b-lg
                `}
                type="button"
              >
                <OptionIcon size={14} style={{ color: option.color }} />
                <span>{option.label}</span>
                {isSelected && (
                  <div className="ml-auto">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PrioritetDropdown;