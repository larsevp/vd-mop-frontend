import React, { useState, useEffect } from "react";
import { useUserStore } from "@/stores/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { updateCurrentUserProfile } from "@/api/userApi";
import { Button } from "@/components/ui/primitives/button";
import { X } from "lucide-react";
import FagomradeSelect from "@/components/tableComponents/FagomradeSelect";
import EnhetSelect from "@/components/tableComponents/EnhetSelect";

/**
 * Onboarding modal that prompts new users to set their fagområde and enhet
 * Shows automatically when user is missing either of these required fields
 */
export function OnboardingModal() {
  const { user, refreshUser } = useUserStore();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    fagomradeId: null,
    enhetId: null,
  });

  // Check if user needs onboarding (missing fagområde or enhet)
  const needsOnboarding = user && (!user.fagomradeId || !user.enhetId);

  useEffect(() => {
    if (needsOnboarding) {
      setIsOpen(true);
      // Pre-fill with existing values if any
      setFormData({
        fagomradeId: user.fagomradeId || null,
        enhetId: user.enhetId || null,
      });
    }
  }, [needsOnboarding, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value ? parseInt(value, 10) : null,
    }));
  };

  const handleSave = async () => {
    // Validate required fields
    if (!formData.fagomradeId) {
      setError("Fagområde er påkrevd");
      return;
    }
    if (!formData.enhetId) {
      setError("Enhet er påkrevd");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Update user on backend using the new profile endpoint
      const response = await updateCurrentUserProfile({
        fagomradeId: formData.fagomradeId,
        enhetId: formData.enhetId,
      });

      // Refresh user info in store
      await refreshUser();

      // Force a full page reload to ensure all data is refetched with new access control
      window.location.reload();
    } catch (err) {
      console.error("Onboarding error:", err.message);

      // Handle specific error messages
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else {
        setError(err.message || "Kunne ikke oppdatere brukerinnstillinger");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !needsOnboarding) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      {/* Overlay - non-dismissible */}
      <div className="fixed inset-0 bg-black/60" />

      {/* Modal Content */}
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Velkommen til MOP!</h2>
            <p className="mt-2 text-sm text-gray-600">
              For å komme i gang må du velge fagområde og enhet. Dette kan endres senere i innstillinger.
            </p>
          </div>

          {/* Form Fields */}
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fagområde <span className="text-red-500">*</span>
              </label>
              <FagomradeSelect
                name="fagomradeId"
                value={formData.fagomradeId}
                onChange={handleChange}
                required={true}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enhet <span className="text-red-500">*</span>
              </label>
              <EnhetSelect
                name="enhetId"
                value={formData.enhetId}
                onChange={handleChange}
                required={true}
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-sm text-blue-800">
                💡 Disse innstillingene bestemmer hvilke data du har tilgang til og hvordan nye elementer kategoriseres.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !formData.fagomradeId || !formData.enhetId}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              {isSaving ? "Lagrer..." : "Fortsett"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
