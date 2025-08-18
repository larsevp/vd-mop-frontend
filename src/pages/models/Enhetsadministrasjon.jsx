import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "../../modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Enhetsadministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig("enheter");

  function handleEdit(row) {
    navigate(`/enheter/${row.id}/rediger`, {
      state: { modelType: "enheter" },
    });
  }
  function handleNew() {
    navigate("/enheter/ny", {
      state: { modelType: "enheter" },
    });
  }
  function handleBack() {
    navigate(-1);
  }
  return (
    <AdminPage
      title="Enhetsadministrasjon"
      description="Administrer organisasjonsenheter"
      listTitle="Organisasjonsenheter"
      newButtonLabel="Ny enhet"
      onNew={handleNew}
      onBack={handleBack}
      showBackButton={true}
      backButtonLabel="Tilbake"
    >
      <RowList fields={config.fields} queryKey={config.queryKey} onEdit={handleEdit} queryFn={config.queryFn} deleteFn={config.deleteFn} />
    </AdminPage>
  );
}
