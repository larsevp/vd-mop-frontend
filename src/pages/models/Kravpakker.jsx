import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "../../modelConfigs";
import { useNavigate } from "react-router-dom";
import { useBackNavigation } from "@/hooks/useBackNavigation";

export default function Kravpakkeradministrasjon() {
  const navigate = useNavigate();
  const { goBack } = useBackNavigation();
  const config = getModelConfig("kravpakker");

  function handleEdit(row) {
    navigate(`/kravpakker/${row.id}/rediger`, {
      state: { modelType: "kravpakker" },
    });
  }
  function handleNew() {
    navigate("/kravpakker/ny", {
      state: { modelType: "kravpakker" },
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
