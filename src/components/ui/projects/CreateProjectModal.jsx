import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProsjekt } from "@/api/endpoints/models/prosjekt";
import { useNavigate } from "react-router-dom";
import { useProjectStore, useUserStore } from "@/stores/userStore";
import { useRecentProjectsStore } from "@/stores/recentProjectsStore";
import EnhetSelect from "@/components/tableComponents/EnhetSelect";

export default function CreateProjectModal({ open, onClose }) {
  const { user } = useUserStore();
  const [formData, setFormData] = useState({
    navn: "",
    prosjektnummer: "",
    beskrivelse: "",
    enhetId: user?.enhetId || null,
  });

  const [errors, setErrors] = useState({});
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setCurrentProject } = useProjectStore();
  const { trackProjectVisit } = useRecentProjectsStore();

  // Update enhetId when user changes or modal opens
  useEffect(() => {
    if (open && user?.enhetId && !formData.enhetId) {
      setFormData(prev => ({ ...prev, enhetId: user.enhetId }));
    }
  }, [open, user?.enhetId, formData.enhetId]);

  const createMutation = useMutation({
    mutationFn: createProsjekt,
    onSuccess: async (response) => {
      const newProject = response.data;

      // Set as current project immediately
      setCurrentProject(newProject);

      // Track the project visit
      trackProjectVisit(newProject, user?.id);

      // Invalidate all project-related queries and wait for them to settle
      await queryClient.invalidateQueries(["projects_list"]);
      await queryClient.invalidateQueries(["prosjekt"]);

      // Close modal
      onClose();

      // Reset form
      setFormData({ navn: "", prosjektnummer: "", beskrivelse: "", enhetId: user?.enhetId || null });
      setErrors({});

      // Navigate to the new project's landing page
      navigate(`/prosjekt/${newProject.id}`);
    },
    onError: (error) => {
      const backendError = error.response?.data?.error || error.message || "Kunne ikke opprette prosjekt";

      // Check if error is about prosjektnummer
      if (backendError.toLowerCase().includes('prosjektnummer')) {
        setErrors({
          prosjektnummer: backendError,
          submit: null
        });
      } else if (backendError.toLowerCase().includes('navn')) {
        setErrors({
          navn: backendError,
          submit: null
        });
      } else {
        // General error
        setErrors({ submit: backendError });
      }
    },
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.navn.trim()) {
      newErrors.navn = "Prosjektnavn er påkrevd";
    }

    if (formData.prosjektnummer && formData.prosjektnummer.length > 50) {
      newErrors.prosjektnummer = "Prosjektnummer kan ikke være lengre enn 50 tegn";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Prepare data for API
    const submitData = {
      navn: formData.navn.trim(),
      prosjektnummer: formData.prosjektnummer.trim() || null,
      beskrivelse: formData.beskrivelse.trim() || null,
      enhetId: formData.enhetId,
    };

    createMutation.mutate(submitData);
  };

  const handleClose = () => {
    if (!createMutation.isLoading) {
      setFormData({ navn: "", prosjektnummer: "", beskrivelse: "", enhetId: user?.enhetId || null });
      setErrors({});
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center p-6 z-[9999]"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-lg max-w-2xl w-full shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-200">
          <h2 className="text-xl font-medium text-gray-900">Opprett nytt prosjekt</h2>
          <button
            onClick={handleClose}
            disabled={createMutation.isLoading}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-8 py-6">
          <div className="space-y-6">
            {/* Project Name */}
            <div>
              <label htmlFor="navn" className="block text-sm font-medium text-gray-700 mb-2">
                Prosjektnavn <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="navn"
                name="navn"
                value={formData.navn}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.navn
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-sky-500"
                }`}
                placeholder="Skriv inn prosjektnavn"
                disabled={createMutation.isLoading}
              />
              {errors.navn && (
                <p className="mt-1.5 text-sm text-red-600">{errors.navn}</p>
              )}
            </div>

            {/* Project Number */}
            <div>
              <label htmlFor="prosjektnummer" className="block text-sm font-medium text-gray-700 mb-2">
                Prosjektnummer
              </label>
              <input
                type="text"
                id="prosjektnummer"
                name="prosjektnummer"
                value={formData.prosjektnummer}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                  errors.prosjektnummer
                    ? "border-red-300 focus:ring-red-500"
                    : "border-gray-300 focus:ring-sky-500"
                }`}
                placeholder="Skriv inn prosjektnummer (valgfritt)"
                disabled={createMutation.isLoading}
              />
              {errors.prosjektnummer && (
                <p className="mt-1.5 text-sm text-red-600">{errors.prosjektnummer}</p>
              )}
            </div>

            {/* Enhet */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enhet
              </label>
              <EnhetSelect
                name="enhetId"
                value={formData.enhetId}
                onChange={handleChange}
                required={false}
                placeholder="Velg enhet..."
                className="w-full"
              />
              {errors.enhetId && (
                <p className="mt-1.5 text-sm text-red-600">{errors.enhetId}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="beskrivelse" className="block text-sm font-medium text-gray-700 mb-2">
                Beskrivelse
              </label>
              <textarea
                id="beskrivelse"
                name="beskrivelse"
                value={formData.beskrivelse}
                onChange={handleChange}
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition-colors resize-none"
                placeholder="Skriv inn prosjektbeskrivelse (valgfritt)"
                disabled={createMutation.isLoading}
              />
            </div>

            {/* Error message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{errors.submit}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={createMutation.isLoading}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
            >
              Avbryt
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="px-5 py-2.5 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isLoading ? "Oppretter..." : "Opprett prosjekt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
