import React from "react";
import { useQuery } from "@tanstack/react-query";
import { getPotentialParents } from "@/api/endpoints";

export default function ParentSelectField({ field, value, onChange, currentLevel }) {
  const {
    data: parents = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["potential-parents", currentLevel],
    queryFn: () => getPotentialParents(currentLevel),
    select: (res) => {
      // If backend returns array directly (Option 1)
      const actualData = res.data || [];

      if (Array.isArray(actualData)) {
        return actualData;
      }
      return [];
    },
    enabled: !!currentLevel && currentLevel > 1, // Only fetch if level > 1
    staleTime: Infinity, // Never automatically refetch - only when form is submitted or cancelled
    cacheTime: Infinity, // Keep in cache indefinitely
  });

  if (isLoading) return <div>Loading parents...</div>;

  if (error) {
    console.error("Error loading parents:", error);
    return <div>Error loading parents</div>;
  }

  // Additional safety check
  if (!Array.isArray(parents)) {
    console.warn("Parents is not an array:", parents);
    return <div>Error: Invalid parent data</div>;
  }

  return (
    <select
      value={value === null ? "null" : value || ""}
      onChange={(e) => {
        const selectedValue = e.target.value;
        if (selectedValue === "null") {
          onChange(null); // Explicitly set to null for "Ingen overordnet enhet"
        } else if (selectedValue === "") {
          onChange(null); // Empty selection also sets to null
        } else {
          onChange(parseInt(selectedValue));
        }
      }}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      <option value="">{field.placeholder || "Velg parent"}</option>
      <option value="null">Ingen overordnet enhet</option>
      {parents.map((parent) => (
        <option key={parent.id} value={parent.id}>
          {parent.navn} (Nivå {parent.level})
        </option>
      ))}
    </select>
  );
}
