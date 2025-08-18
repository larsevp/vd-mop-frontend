import React from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "../../modelConfigs";
import { useNavigate } from "react-router-dom";

export default function Statusadministrasjon() {
  const navigate = useNavigate();
  const config = getModelConfig("status");

  function handleEdit(row) {
    navigate(`/status/${row.id}/rediger`, {
      state: { modelType: "status" },
    });
  }
  function handleNew() {
    navigate("/status/ny", {
      state: { modelType: "status" },
    });
  }
  function handleBack() {
    navigate(-1);
  }
  return (
    <AdminPage
      title="Status-administrasjon"
      description="Administrer status"
      listTitle="Status"
      newButtonLabel="Ny status"
      onNew={handleNew}
      onBack={handleBack}
      showBackButton={true}
      backButtonLabel="Tilbake"
    >
      <RowList fields={config.fields} queryKey={config.queryKey} onEdit={handleEdit} queryFn={config.queryFn} deleteFn={config.deleteFn} />
    </AdminPage>
  );
}
