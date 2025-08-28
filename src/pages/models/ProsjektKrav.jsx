import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "@/modelConfigs";
import { useNavigate } from "react-router-dom";

export default function ProsjektKrav() {
  const navigate = useNavigate();
  const config = getModelConfig("prosjektKrav");

  function handleEdit(row) {
    navigate(`/prosjekt-krav/${row.id}/rediger`, {
      state: { modelType: "prosjektKrav" },
    });
  }
  function handleNew() {
    navigate("/prosjekt-krav/ny", {
      state: { modelType: "prosjektKrav" },
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
      showBackButton={true}
      backButtonLabel="Tilbake"
    >
      <RowList fields={config.fields} queryKey={config.queryKey} onEdit={handleEdit} queryFn={config.queryFn} deleteFn={config.deleteFn} />
    </AdminPage>
  );
}