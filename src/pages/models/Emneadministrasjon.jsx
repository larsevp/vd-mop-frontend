import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "@/modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Emneadministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig("emner");

  function handleEdit(row) {
    navigate(`/emner/${row.id}/rediger`, {
      state: { modelType: "emner" },
    });
  }
  function handleNew() {
    navigate("/emner/ny", {
      state: { modelType: "emner" },
    });
  }
  function handleBack() {
    navigate(-1);
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
