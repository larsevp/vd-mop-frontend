import React, { useState } from "react";
import { krav as kravConfig } from "@/modelConfigs/models/krav.js";

// Custom Krav components that leverage existing infrastructure
import KravDetailDisplay from "./components/KravDetailDisplay";
import { Toast } from "@/components/ui/editor/components/Toast.jsx";

/**
 * Master component that coordinates all Krav views:
 * - CREATE: Uses KravDetailDisplay in create mode
 * - EDIT: Uses KravDetailDisplay in edit mode
 * - VIEW: Uses KravDetailDisplay in view mode
 *
 * KravDetailDisplay controls the layout and presentation for all modes,
 * ensuring consistent sectioning and field organization.
 */
const KravMasterView = ({ krav, mode = "view", onSave, onCancel, onEdit, onNavigateToKrav, isVisible = true }) => {
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <KravDetailDisplay
        krav={krav}
        mode={mode}
        onEdit={onEdit}
        onSave={onSave}
        onCancel={onCancel}
        onNavigateToKrav={onNavigateToKrav}
        modelConfig={kravConfig}
      />

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
};

export default KravMasterView;
