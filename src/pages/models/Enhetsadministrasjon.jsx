import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "../../modelConfigs";
import { useNavigate } from "react-router-dom";
import { useBackNavigation } from "@/hooks/useBackNavigation";

export default function Enhetsadministrasjon() {
  const navigate = useNavigate();
  const { goBack } = useBackNavigation();
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
    goBack();
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
