import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "@/modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Tiltak() {
  const navigate = useNavigate();
  const config = getModelConfig("tiltak");

  function handleEdit(row) {
    navigate(`/tiltak/${row.id}/rediger`, {
      state: { modelType: "tiltak" },
    });
  }
  function handleNew() {
    navigate("/tiltak/ny", {
      state: { modelType: "tiltak" },
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
      newButtonLabel={config.newButtonLabel}
      onNew={handleNew}
      onBack={handleBack}
      showBackButton={true}
      backButtonLabel="Tilbake"
    >
      <RowList fields={config.fields} queryKey={config.queryKey} onEdit={handleEdit} queryFn={config.queryFn} deleteFn={config.deleteFn} />
    </AdminPage>
  );
}
