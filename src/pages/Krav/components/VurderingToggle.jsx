import React from "react";
import { ThumbsUp, ThumbsDown, Minus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getVurderingerSimple as getVurderinger } from "@/api/endpoints/models/vurdering";

/**
 * VurderingToggle component that loads real vurdering options and displays as clickable badge
 * Uses the same API as VurderingSelect component for consistency
 */
const VurderingToggle = ({ 
  value,
  onChange,
  loading = false,
  className = ""
}) => {
  // Load vurdering options using the same query as VurderingSelect
  const { data: vurderingOptions = [], isLoading: optionsLoading } = useQuery({
    queryKey: ["vurderinger"],
    queryFn: getVurderinger,
  });


  // Create options array with null option for "no vurdering"
  const allOptions = [
    { id: null, navn: "Ikke vurdert", icon: Minus, badgeClass: "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200" },
    ...(Array.isArray(vurderingOptions) ? vurderingOptions.map(vurdering => ({
      ...vurdering,
      icon: vurdering.navn?.toLowerCase().includes('positiv') || vurdering.navn?.toLowerCase().includes('bra') ? ThumbsUp : 
            vurdering.navn?.toLowerCase().includes('negativ') || vurdering.navn?.toLowerCase().includes('dårlig') ? ThumbsDown : Minus,
      badgeClass: vurdering.navn?.toLowerCase().includes('positiv') || vurdering.navn?.toLowerCase().includes('bra') ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" :
                  vurdering.navn?.toLowerCase().includes('negativ') || vurdering.navn?.toLowerCase().includes('dårlig') ? "bg-red-100 text-red-700 border-red-200 hover:bg-red-200" :
                  "bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200"
    })) : [])
  ];

  const currentVurdering = allOptions.find(opt => opt.id === value) || allOptions[0];

  const handleClick = async (e) => {
    e.stopPropagation(); // Prevent card click
    if (loading || optionsLoading || !onChange) return;
    
    // Cycle through options
    const currentIndex = allOptions.findIndex(opt => opt.id === value);
    const nextIndex = (currentIndex + 1) % allOptions.length;
    const newValue = allOptions[nextIndex].id;
    
    try {
      await onChange(newValue);
    } catch (error) {
      console.error("Vurdering change failed:", error);
    }
  };

  const IconComponent = currentVurdering.icon;
  const isLoading = loading || optionsLoading;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        text-xs font-semibold px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 border-2 border-dashed transition-all duration-200
        ${currentVurdering.badgeClass}
        ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-105 active:scale-95'}
        shadow-sm hover:shadow-md disabled:opacity-50 ${className}
      `}
      title={`Vurdering: ${currentVurdering.navn} (klikk for å endre)`}
    >
      {isLoading ? (
        <div className="animate-spin rounded-full h-3 w-3 border-b border-current"></div>
      ) : (
        <IconComponent size={11} />
      )}
      {currentVurdering.navn}
      {!isLoading && (
        <div className="text-xs opacity-60 ml-1">▼</div>
      )}
    </button>
  );
};

export default VurderingToggle;