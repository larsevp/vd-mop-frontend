import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "../../modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Kravpakkeradministrasjon() {
  const navigate = useNavigate();
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
