import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "@/modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Kravreferansetype() {
  const navigate = useNavigate();
  const config = getModelConfig("kravreferansetyper");

  function handleEdit(row) {
    navigate(`/kravreferansetype/${row.id}/rediger`, {
      state: { modelType: "kravreferansetyper" },
    });
  }
  function handleNew() {
    navigate("/kravreferansetype/ny", {
      state: { modelType: "kravreferansetyper" },
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
