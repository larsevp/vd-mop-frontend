import React, { useMemo } from "react";
import { RowList, AdminPage } from "@/components/tableComponents/";
import { getModelConfig } from "../../modelConfigs";
import { useNavigate } from "react-router-dom";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { useUserStore } from "@/stores/userStore";

export default function Emneadministrasjon() {
  const navigate = useNavigate();
  const { goBack } = useBackNavigation();
  const user = useUserStore((state) => state.user);
  const isAdmin = user?.rolle === "ADMIN";
  const config = getModelConfig("emner");

  // Filter fields based on admin status
  const filteredFields = useMemo(() => {
    return config.fields.filter(field => {
      // If field has adminOnly flag and user is not admin, hide it
      if (field.adminOnly && !isAdmin) {
        return false;
      }
      return true;
    });
  }, [config.fields, isAdmin]);

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
      <RowList fields={filteredFields} queryKey={config.queryKey} onEdit={handleEdit} queryFn={config.queryFn} deleteFn={config.deleteFn} />
    </AdminPage>
  );
}
