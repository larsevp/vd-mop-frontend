import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getEnheter, getEnheterSimple } from "@/api/endpoints";
import { ComboBox } from "@/components/ui/form/ComboBox";
import { Check, Folder, FolderOpen, File, Dot } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EnhetSelect for hierarchical unit selection using ComboBox
 * Features:
 * - Hierarchical display with indentation
 * - Proper level indicators
 * - Loading and error states
 * - Integration with form validation
 * - Built on ComboBox component for consistency
 */
export default function EnhetSelect({ name, value, onChange, label, required = false, placeholder = "Velg enhet...", className = "" }) {
  const {
    data: enheter = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["enheter"],
    queryFn: getEnheterSimple,
    select: (response) => {
      // Handle both direct array and response.data patterns
      const data = Array.isArray(response) ? response : response.data || [];
      return data;
    },
  });

  // Sort enheter hierarchically and convert to ComboBox options
  const hierarchicalOptions = React.useMemo(() => {
    if (!enheter.length) return [];

    // Build a tree structure
    const enhetMap = new Map();
    const roots = [];

    // First pass: create map
    enheter.forEach((enhet) => {
      enhetMap.set(enhet.id, { ...enhet, children: [] });
    });

    // Second pass: identify roots
    // A root is either:
    // 1. No parentId or parentId equals its own id (self-reference)
    // 2. Has a parentId but parent is not in the accessible list (orphaned due to access control)
    enheter.forEach((enhet) => {
      if (!enhet.parentId || enhet.parentId === enhet.id) {
        roots.push(enhet.id);
      } else if (!enhetMap.has(enhet.parentId)) {
        // Parent not in accessible list - treat as root
        roots.push(enhet.id);
      }
    });

    // Third pass: build parent-child relationships
    enheter.forEach((enhet) => {
      // Only add as child if parentId exists, is different from own id, and parent exists in map
      if (enhet.parentId && enhet.parentId !== enhet.id && enhetMap.has(enhet.parentId)) {
        enhetMap.get(enhet.parentId).children.push(enhet.id);
      }
    });

    // Flatten the tree in hierarchical order
    const flattenTree = (nodeId, depth = 0) => {
      const node = enhetMap.get(nodeId);
      if (!node) return [];

      const result = [
        {
          id: node.id.toString(),
          label: node.navn, // Keep clean label for display
          originalLabel: node.navn,
          depth,
          hasChildren: node.children.length > 0,
        },
      ];

      // Sort children by name and recursively add them
      node.children
        .sort((a, b) => enhetMap.get(a).navn.localeCompare(enhetMap.get(b).navn))
        .forEach((childId) => {
          result.push(...flattenTree(childId, depth + 1));
        });

      return result;
    };

    // Start with root nodes, sorted by name
    return roots.sort((a, b) => enhetMap.get(a).navn.localeCompare(enhetMap.get(b).navn)).flatMap((rootId) => flattenTree(rootId));
  }, [enheter]);

  // Custom filter function that searches the original labels (without indentation)
  const hierarchicalFilter = React.useCallback((option, searchValue) => {
    return option.originalLabel.toLowerCase().includes(searchValue.toLowerCase());
  }, []);

  // Handle selection and convert to number value
  const handleChange = React.useCallback(
    (event) => {
      const newValue = event.target.value ? parseInt(event.target.value, 10) : null;
      onChange({
        target: {
          name,
          value: newValue,
          type: "select",
        },
      });
    },
    [name, onChange]
  );

  // Custom render function for hierarchical options
  const renderHierarchicalOption = React.useCallback((option, isSelected, isActive) => {
    const depth = option.depth || 0;
    const hasChildren = option.hasChildren || false;

    // Create visual hierarchy with proper styling
    const indentationStyle = {
      paddingLeft: `${8 + depth * 16}px`, // Base padding + depth-based indentation
    };

    // Different icons/styling based on depth and whether it has children
    const getHierarchyIcon = () => {
      if (depth === 0) {
        // Root level - folders for containers, files for items
        return hasChildren ? (
          <Folder className="h-4 w-4 text-indigo-600 fill-indigo-100" />
        ) : (
          <File className="h-4 w-4 text-indigo-500 fill-indigo-50" />
        );
      } else if (depth === 1) {
        // Second level - open folders and files with different colors
        return hasChildren ? (
          <FolderOpen className="h-4 w-4 text-emerald-600 fill-emerald-100" />
        ) : (
          <File className="h-4 w-4 text-emerald-500 fill-emerald-50" />
        );
      } else if (depth === 2) {
        // Third level - folders as well, smaller and different color
        return hasChildren ? (
          <Folder className="h-3.5 w-3.5 text-orange-600 fill-orange-100" />
        ) : (
          <File className="h-3.5 w-3.5 text-orange-500 fill-orange-50" />
        );
      } else {
        // Deeper levels - simple dots with nice purple
        return <Dot className="h-2.5 w-2.5 text-violet-500 fill-violet-500" />;
      }
    };

    const getFontWeight = () => {
      if (depth === 0) return "font-semibold";
      if (depth === 1) return "font-medium";
      return "font-normal";
    };

    const getTextSize = () => {
      if (depth === 0) return "text-sm";
      return "text-sm";
    };

    return (
      <>
        <Check className={cn("mr-2 h-4 w-4 flex-shrink-0", isSelected ? "opacity-100" : "opacity-0")} />
        <div
          className={cn(
            "flex items-center flex-1 min-w-0",
            getFontWeight(),
            getTextSize(),
            isActive ? "text-accent-foreground" : "text-foreground"
          )}
          style={indentationStyle}
        >
          <span className="mr-2 flex-shrink-0">{getHierarchyIcon()}</span>
          <span className="truncate">{option.label}</span>
        </div>
      </>
    );
  }, []);

  return (
    <ComboBox
      name={name}
      label={label}
      value={value?.toString() || null}
      onChange={handleChange}
      placeholder={placeholder}
      required={required}
      disabled={false}
      className={className}
      allowEmpty={true}
      emptyLabel="Ingen enhet"
      options={hierarchicalOptions}
      isLoading={isLoading}
      error={error?.message || null}
      filterFn={hierarchicalFilter}
      renderOption={renderHierarchicalOption}
    />
  );
}
