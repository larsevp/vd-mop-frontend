import React from "react";
import { useNavigate } from "react-router-dom";
import { RowList, AdminPage } from "@/components/tableComponents";
import { getModelConfig } from "../../modelConfigs";
import { useSmartBack } from "@/hooks/useSmartBack";

export default function Prosjektadministrasjon() {
  const navigate = useNavigate();
  const { goBack } = useSmartBack();
  const config = getModelConfig("prosjekter");

  function handleEdit(row) {
    navigate(`/prosjekter/${row.id}/rediger`, {
      state: { modelType: "prosjekter" },
    });
  }
  function handleNew() {
    navigate("/prosjekter/ny", {
      state: { modelType: "prosjekter" },
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
      showBackButton={true}
      backButtonLabel="Tilbake"
    >
      <RowList
        fields={config.fields}
        onEdit={handleEdit}
        queryKey={config.queryKey}
        queryFn={config.queryFn}
        deleteFn={config.deleteFn}
        loadingText="Laster prosjekter..."
      />
    </AdminPage>
  );
}
