import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "@/modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Lov() {
  const navigate = useNavigate();
  const config = getModelConfig("lover");

  function handleEdit(row) {
    navigate(`/lov/${row.id}/rediger`, {
      state: { modelType: "lover" },
    });
  }
  function handleNew() {
    navigate("/lov/ny", {
      state: { modelType: "lover" },
    });
  }
  function handleBack() {
    navigate("/");
  }
  return (
    <AdminPage
      title={config.title}
      description={config.desc}
      listTitle={config.title}
      newButtonLabel={config.newButtonLabelText}
      onNew={handleNew}
      onBack={handleBack}
      backButtonLabel="Tilbake"
    >
      <RowList fields={config.fields} queryKey={config.queryKey} onEdit={handleEdit} queryFn={config.queryFn} deleteFn={config.deleteFn} />
    </AdminPage>
  );
}
