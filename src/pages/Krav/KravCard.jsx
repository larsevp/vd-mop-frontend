import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/primitives/button";
import { Edit, Trash2, FileText, CheckCircle, AlertCircle, Clock, Paperclip, GitBranch, ArrowUp } from "lucide-react";
import { getFilesByModel } from "@/api/endpoints/models/files";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";
import MerknadField from "./components/MerknadField";
import EntityDropdown from "./components/EntityDropdown";
import PrioritetDropdown from "./components/PrioritetDropdown";

const KravCard = ({ 
  krav, 
  onEdit, 
  onDelete, 
  onView, 
  onMerknadUpdate, 
  onStatusChange,
  onVurderingChange,
  onPrioritetChange,
  showMerknader = false, 
  showStatus = false,
  showVurdering = false,
  showPrioritet = false,
  filesCount = 0, 
  childrenCount = 0, 
  parentKrav = null 
}) => {
  // Loading states for individual dropdowns
  const [statusLoading, setStatusLoading] = useState(false);
  const [vurderingLoading, setVurderingLoading] = useState(false);
  const [prioritetLoading, setPrioritetLoading] = useState(false);

  // Handlers with loading states
  const handleStatusChange = async (newValue) => {
    // Check if krav has a valid ID
    if (!krav?.id || krav.id === "create-new") {
      console.error("Cannot change status: krav ID is missing or invalid");
      return;
    }

    setStatusLoading(true);
    try {
      await onStatusChange?.(krav.id, newValue);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleVurderingChange = async (newValue) => {
    // Check if krav has a valid ID
    if (!krav?.id || krav.id === "create-new") {
      console.error("Cannot change vurdering: krav ID is missing or invalid");
      return;
    }

    setVurderingLoading(true);
    try {
      await onVurderingChange?.(krav.id, newValue);
    } finally {
      setVurderingLoading(false);
    }
  };

  const handlePrioritetChange = async (newValue) => {
    // Check if krav has a valid ID
    if (!krav?.id || krav.id === "create-new") {
      console.error("Cannot change prioritet: krav ID is missing or invalid");
      return;
    }

    setPrioritetLoading(true);
    try {
      await onPrioritetChange?.(krav.id, newValue);
    } finally {
      setPrioritetLoading(false);
    }
  };

  const getPriorityDisplay = (prioritet) => {
    if (!prioritet) return { text: "Lav", color: "bg-gray-100 text-gray-600" };
    if (prioritet >= 30) return { text: "Høy", color: "bg-red-100 text-red-700" };
    if (prioritet >= 20) return { text: "Middels", color: "bg-yellow-100 text-yellow-700" };
    return { text: "Lav", color: "bg-green-100 text-green-700" };
  };

  const getStatusIcon = (obligatorisk) => {
    if (obligatorisk) {
      return <AlertCircle size={16} className="text-red-500" />;
    }
    return <Clock size={16} className="text-gray-400" />;
  };

  const truncateText = (text, maxLength = 120) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div
      className={`bg-white rounded-xl border hover:border-blue-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group cursor-pointer relative ${
        krav.parentId ? "border-l-4 border-l-blue-400 border-neutral-200" : "border-neutral-200"
      }`}
      onClick={() => onView?.(krav)}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50/0 to-blue-50/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      <div className="p-6 flex gap-6 relative">
        {/* Main content area - Title, UID, and Description */}
        <div className="flex-1 min-w-0 space-y-3">
          {/* Title and UID row */}
          <div className="flex items-start gap-4">
            <span className="text-sm font-mono text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg flex-shrink-0 font-medium border border-blue-100">
              {krav.kravUID || `GK${krav.id}`}
            </span>
            <h3
              className="font-semibold text-gray-900 text-xl leading-tight flex-1 group-hover:text-blue-700 transition-colors"
              title={krav.tittel}
            >
              {krav.tittel || "Uten tittel"}
            </h3>
          </div>

          {/* Description */}
          {(krav.beskrivelseSnippet || krav.beskrivelse) && (
            <div className="pl-1">
              <p
                className="text-gray-600 leading-relaxed text-[15px] overflow-hidden"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  maxHeight: "3rem",
                }}
              >
                {truncateText(krav.beskrivelseSnippet || krav.beskrivelse, 220)}
              </p>
            </div>
          )}

          {/* Merknad Field - Only show if showMerknader is true and merknad exists */}
          {showMerknader && (
            <div className="pl-1">
              <MerknadField 
                krav={krav} 
                onMerknadUpdate={onMerknadUpdate}
                className="mt-3"
              />
            </div>
          )}
        </div>

        {/* Right sidebar - Status, badges, and actions */}
        <div className="flex flex-col items-end gap-3 flex-shrink-0 min-w-[140px]">
          {/* Actionable Controls Row - All dropdowns grouped together */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Status Dropdown */}
            {showStatus && krav?.id && krav.id !== "create-new" && (
              <EntityDropdown
                type="status"
                value={krav.statusId}
                onChange={handleStatusChange}
                loading={statusLoading}
              />
            )}

            {/* Vurdering Dropdown */}
            {showVurdering && krav?.id && krav.id !== "create-new" && (
              <EntityDropdown
                type="vurdering"
                value={krav.vurderingId}
                onChange={handleVurderingChange}
                loading={vurderingLoading}
              />
            )}

            {/* Priority Dropdown */}
            {showPrioritet && krav?.id && krav.id !== "create-new" && (
              <PrioritetDropdown
                value={krav.prioritet}
                onChange={handlePrioritetChange}
                loading={prioritetLoading}
              />
            )}
          </div>

          {/* Status and Info badges row */}
          <div className="flex flex-wrap items-center gap-2 justify-end">
            {/* Obligatorisk/Valgfritt status badge */}
            {krav.obligatorisk ? (
              <span className="text-xs text-red-700 font-semibold flex items-center gap-1.5 px-3 py-1.5 bg-red-50 rounded-lg border border-red-100">
                <AlertCircle size={14} />
                Obligatorisk
              </span>
            ) : (
              <span className="text-xs text-gray-600 font-medium flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                <Clock size={14} />
                Valgfritt
              </span>
            )}

            {krav.parentId && (
              <span
                className="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-indigo-100"
                title={parentKrav ? `Underkrav av: ${parentKrav.tittel}` : "Underkrav"}
              >
                <ArrowUp size={11} />
                Underkrav
              </span>
            )}

            {childrenCount > 0 && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-emerald-100">
                <GitBranch size={11} />
                {childrenCount} underkrav
              </span>
            )}

            {filesCount > 0 && (
              <span className="text-xs bg-amber-50 text-amber-700 px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-medium border border-amber-100">
                <Paperclip size={11} />
                {filesCount} {filesCount === 1 ? "fil" : "filer"}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-300 mt-auto transform translate-y-1 group-hover:translate-y-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit?.(krav);
              }}
              className="h-9 px-3 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              title="Rediger"
            >
              <Edit size={16} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(krav);
              }}
              className="h-9 px-3 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
              title="Slett"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KravCard;
