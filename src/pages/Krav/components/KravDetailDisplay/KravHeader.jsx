import { Button } from "@/components/ui/primitives/button";
import { X, Edit, Save } from "lucide-react";
import { CheckCircle, Hash } from "lucide-react";

/**
 * Header component for the Krav detail display
 */
const KravHeader = ({ krav, mode, loading, onEdit, onCancel, onSubmit }) => {
  const isEditing = mode === "edit" || mode === "create";
  const isCreating = mode === "create";

  const getPriorityDisplay = (prioritet) => {
    if (!prioritet) return { text: "Ikke satt", color: "text-gray-500", bg: "bg-gray-100" };
    if (prioritet >= 30) return { text: "Høy", color: "text-red-700", bg: "bg-red-100" };
    if (prioritet >= 20) return { text: "Middels", color: "text-yellow-700", bg: "bg-yellow-100" };
    return { text: "Lav", color: "text-green-700", bg: "bg-green-100" };
  };

  const priority = getPriorityDisplay(krav?.prioritet);

  return (
    <div className="px-6 py-4 bg-white border-b border-neutral-200 flex items-start justify-between">
      <div className="flex-1">
        {isEditing ? (
          <h1 className="text-2xl font-bold text-neutral-900 mb-2">
            {isCreating ? "Opprett nytt krav" : `Rediger: ${krav?.tittel || krav?.kravUID || "Krav"}`}
          </h1>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-sm font-mono text-neutral-500 bg-neutral-100 px-2 py-1 rounded">{krav?.kravUID || `#${krav?.id}`}</span>
              {krav?.obligatorisk && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-red-700 bg-red-100">
                  <CheckCircle size={12} />
                  Obligatorisk
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${priority.color} ${priority.bg}`}
              >
                <Hash size={12} />
                {priority.text}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-neutral-900 mb-2">{krav?.tittel || "Uten tittel"}</h1>
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {isEditing ? (
          <>
            <Button onClick={onCancel} variant="outline" size="sm" disabled={loading}>
              Avbryt
            </Button>
            <Button onClick={onSubmit} size="sm" disabled={loading} className="bg-blue-600 text-white hover:bg-blue-700">
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Lagrer...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  {isCreating ? "Opprett" : "Oppdater"}
                </div>
              )}
            </Button>
          </>
        ) : (
          <>
            <Button onClick={() => onEdit?.(krav)} variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Rediger
            </Button>
            <Button onClick={onCancel} variant="ghost" size="sm">
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

export default KravHeader;
