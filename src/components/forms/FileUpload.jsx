import React, { useState, useEffect } from "react";
import { Button } from "../ui/primitives/button";
import { Upload, File, Image, FileText, Download, Trash2, FileSpreadsheet, Archive } from "lucide-react";
import { getFilesByModel, getFileSignedUrl, deleteFileWithCleanup, uploadFile, getFileThumbnail } from "@/api/endpoints/models/files";
import { Toast } from "../ui/editor/components/Toast";

// Cache for file lists to prevent excessive API calls
const fileCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const FileUpload = ({
  modelType,
  modelId,
  label = "Filer",
  onFilesChange,
  showUpload = true,
  showTitle = false,
  thumbnailSize = 100, // Default 60px for better visibility
}) => {

  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: "", type: "info" });
  const [thumbnails, setThumbnails] = useState({});
  const [signedUrls, setSignedUrls] = useState({}); // Cache for signed URLs
  const [loadingSignedUrl, setLoadingSignedUrl] = useState({}); // Track loading state

  const showToast = (message, type = "info") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 4000);
  };

  // Load thumbnails for files that have them
  const loadThumbnails = async (fileList) => {
    const newThumbnails = {};
    const filesToLoad = fileList.filter((file) => file.hasThumbnail && file.id && !thumbnails[file.id]);

    if (filesToLoad.length === 0) return;

    // Batch load thumbnails to reduce API calls
    try {
      const thumbnailPromises = filesToLoad.map(async (file) => {
        try {
          const response = await getFileThumbnail(file.id);
          return { fileId: file.id, url: response.data.url };
        } catch (error) {
          console.error(`Error loading thumbnail for file ${file.id}:`, error);
          return null;
        }
      });

      const results = await Promise.allSettled(thumbnailPromises);

      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          newThumbnails[result.value.fileId] = result.value.url;
        }
      });

      if (Object.keys(newThumbnails).length > 0) {
        setThumbnails((prev) => ({ ...prev, ...newThumbnails }));
      }
    } catch (error) {
      console.error("Error batch loading thumbnails:", error);
    }
  };

  // Load existing files for this model
  useEffect(() => {
    if (modelId && modelType && modelId !== "create-new") {
      loadFiles();
    } else {
      setLoading(false);
      setFiles([]);
    }
  }, [modelType, modelId]);

  const loadFiles = async () => {
    if (!modelId) return;

    const cacheKey = `${modelType}_${modelId}`;
    const cachedData = fileCache.get(cacheKey);

    // Check if we have valid cached data
    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
      setFiles(cachedData.files);
      setLoading(false);
      // Load thumbnails for cached files
      await loadThumbnails(cachedData.files);
      return;
    }

    try {
      setLoading(true);
      const response = await getFilesByModel(modelType, modelId);
      const fileList = response.data || [];

      // Cache the result
      fileCache.set(cacheKey, {
        files: fileList,
        timestamp: Date.now(),
      });

      setFiles(fileList);

      // Load thumbnails for files that have them
      await loadThumbnails(fileList);
    } catch (error) {
      console.error("Error loading files:", error);
      showToast("Kunne ikke laste filer", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const selectedFiles = Array.from(event.target.files);
    if (selectedFiles.length === 0) return;

    setUploading(true);
    const uploadPromises = selectedFiles.map(uploadSingleFile);

    try {
      await Promise.all(uploadPromises);
      showToast(`${selectedFiles.length} fil(er) lastet opp`, "success");

      // Invalidate cache and reload files
      if (modelId) {
        const cacheKey = `${modelType}_${modelId}`;
        fileCache.delete(cacheKey);
        await loadFiles(); // Reload files after upload
      }

      if (onFilesChange) {
        onFilesChange();
      }
    } catch (error) {
      showToast("Noen filer kunne ikke lastes opp", "error");
    } finally {
      setUploading(false);
    }
  };

  const uploadSingleFile = async (file) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("relatedModelType", modelType);
    if (modelId) {
      formData.append("relatedModelId", modelId);
    }

    const response = await uploadFile(formData);
    return response.data;
  };

  const handleDeleteFile = async (fileId) => {
    if (!confirm("Er du sikker på at du vil slette denne filen?")) return;

    try {
      await deleteFileWithCleanup(fileId);
      showToast("Fil slettet", "success");

      // Invalidate cache and reload files
      if (modelId) {
        const cacheKey = `${modelType}_${modelId}`;
        fileCache.delete(cacheKey);
      }

      await loadFiles();
      if (onFilesChange) {
        onFilesChange();
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      showToast("Kunne ikke slette fil", "error");
    }
  };

  const handleDownloadFile = async (file) => {
    try {
      const response = await getFileSignedUrl(file.id);
      window.open(response.data.url, "_blank");
    } catch (error) {
      console.error("Error downloading file:", error);
      showToast("Kunne ikke åpne fil", "error");
    }
  };

  const getFileIcon = (fileType) => {
    // Calculate icon size as ~2/3 of thumbnail size, with min 16 and max 48
    const iconSize = Math.max(16, Math.min(48, Math.round(thumbnailSize * 0.67)));

    if (fileType.startsWith("image/")) {
      return <Image size={iconSize} className="text-blue-500" />;
    } else if (fileType === "application/pdf") {
      return <FileText size={iconSize} className="text-red-500" />;
    } else if (fileType.includes("word") || fileType.includes("document")) {
      return <FileText size={iconSize} className="text-blue-600" />;
    } else if (fileType.includes("excel") || fileType.includes("spreadsheet")) {
      return <FileSpreadsheet size={iconSize} className="text-green-600" />;
    } else if (fileType.includes("powerpoint") || fileType.includes("presentation")) {
      return <FileText size={iconSize} className="text-orange-600" />;
    } else if (fileType === "text/plain" || fileType === "text/csv") {
      return <FileText size={iconSize} className="text-gray-600" />;
    } else if (fileType === "application/zip") {
      return <Archive size={iconSize} className="text-purple-600" />;
    } else {
      return <File size={iconSize} className="text-gray-500" />;
    }
  };

  const getThumbnail = (file) => {
    // Check if we have a cached thumbnail URL for this file
    if (file.hasThumbnail && thumbnails[file.id]) {
      return (
        <img
          src={thumbnails[file.id]}
          alt={file.fileName}
          className="object-cover cursor-pointer transition-all duration-200 hover:scale-105"
          style={{
            width: `${thumbnailSize}px`,
            height: `${thumbnailSize}px`,
          }}
          onClick={() => handleDownloadFile(file)}
        />
      );
    }

    // Fall back to icon
    return (
      <div
        className="flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 bg-white"
        style={{
          width: `${thumbnailSize}px`,
          height: `${thumbnailSize}px`,
        }}
        onClick={() => handleDownloadFile(file)}
      >
        {getFileIcon(file.fileType)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {showTitle && <label className="block text-sm font-medium text-gray-700">{label}</label>}
        <div className="text-sm text-gray-500">Laster filer...</div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showTitle && (
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">{label}</label>
        </div>
      )}

      {files.length > 0 && (
        <div className="space-y-4">
          {/* Header row - Scandinavian minimal styling */}
          <div className="flex items-center gap-3">
            {showUpload && (
              <>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id={`file-upload-${modelType}-${modelId || "new"}`}
                  disabled={uploading}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById(`file-upload-${modelType}-${modelId || "new"}`).click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-normal rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload size={14} className={uploading ? "animate-pulse" : ""} />
                  {uploading ? "Laster opp..." : "Last opp"}
                </button>
              </>
            )}
            <div className="text-sm text-slate-600 font-normal">
              {files.length} {files.length === 1 ? 'fil' : 'filer'}
            </div>
          </div>

          {/* File grid - clean and minimal */}
          <div className="flex flex-wrap gap-4">
            {files.map((file) => (
              <div key={file.id} className="relative group flex-shrink-0">
                <div className="space-y-2">
                  <div
                    className="relative rounded-lg overflow-hidden transition-all duration-200 border border-slate-200 group-hover:border-slate-300"
                    style={{
                      width: `${thumbnailSize}px`,
                      height: `${thumbnailSize}px`,
                    }}
                  >
                    {getThumbnail(file)}

                    {/* Action buttons - subtle overlay on hover */}
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                      <button
                        type="button"
                        onClick={() => handleDownloadFile(file)}
                        className="h-7 w-7 flex items-center justify-center bg-white/95 text-slate-700 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-full transition-all duration-200"
                        title="Åpne fil"
                      >
                        <Download size={13} />
                      </button>
                    </div>

                    {showUpload && (
                      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button
                          type="button"
                          onClick={() => handleDeleteFile(file.id)}
                          className="h-7 w-7 flex items-center justify-center bg-white/95 text-slate-700 hover:text-red-600 border border-slate-200 hover:border-red-300 rounded-full transition-all duration-200"
                          title="Slett fil"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-slate-600 truncate max-w-[100px]" title={file.fileName}>
                    {(() => {
                      if (file.fileName.length <= 15) return file.fileName;

                      const lastDotIndex = file.fileName.lastIndexOf(".");
                      if (lastDotIndex === -1) {
                        return `${file.fileName.substring(0, 15)}...`;
                      }

                      const extension = file.fileName.substring(lastDotIndex);
                      const nameWithoutExt = file.fileName.substring(0, lastDotIndex);
                      const maxNameLength = 15 - extension.length - 3;

                      if (maxNameLength <= 0) {
                        return `${file.fileName.substring(0, 15)}...`;
                      }

                      return `${nameWithoutExt.substring(0, maxNameLength)}...${extension}`;
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {files.length === 0 && !uploading && (
        <div className="space-y-3">
          <div className="text-sm text-slate-500 font-normal">Ingen filer lastet opp</div>
          {showUpload && (
            <div>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id={`file-upload-${modelType}-${modelId || "new"}`}
                disabled={uploading}
              />
              <button
                type="button"
                onClick={() => document.getElementById(`file-upload-${modelType}-${modelId || "new"}`).click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-normal rounded-lg text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload size={14} className={uploading ? "animate-pulse" : ""} />
                {uploading ? "Laster opp..." : "Last opp filer"}
              </button>
            </div>
          )}
        </div>
      )}

      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
// Only re-render if modelType, modelId, showUpload, or label changes
export default React.memo(FileUpload, (prevProps, nextProps) => {
  return (
    prevProps.modelType === nextProps.modelType &&
    prevProps.modelId === nextProps.modelId &&
    prevProps.showUpload === nextProps.showUpload &&
    prevProps.label === nextProps.label &&
    prevProps.thumbnailSize === nextProps.thumbnailSize
    // Note: We intentionally don't compare onFilesChange to avoid re-renders from function reference changes
  );
});
