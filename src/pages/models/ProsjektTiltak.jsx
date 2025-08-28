import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "@/modelConfigs";
import { useNavigate } from "react-router-dom";

export default function ProsjektTiltak() {
  const navigate = useNavigate();
  const config = getModelConfig("prosjektTiltak");

  function handleEdit(row) {
    navigate(`/prosjekt-tiltak/${row.id}/rediger`, {
      state: { modelType: "prosjektTiltak" },
    });
  }
  function handleNew() {
    navigate("/prosjekt-tiltak/ny", {
      state: { modelType: "prosjektTiltak" },
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