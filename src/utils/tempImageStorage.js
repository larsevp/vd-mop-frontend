/**
 * LocalStorage Image Manager
 *
 * Manages images in localStorage for TipTap editor before upload
 */

const STORAGE_KEY = "tiptap_temp_images";
const MAX_STORAGE_SIZE = 50 * 1024 * 1024; // 50MB limit

/**
 * Generate a unique temporary ID for an image
 */
export function generateTempImageId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store an image file in localStorage with a temporary ID
 */
export async function storeTempImage(file, tempId = null) {
  const id = tempId || generateTempImageId();

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const base64Data = reader.result;
        const imageData = {
          id,
          fileName: file.name || `pasted-image-${Date.now()}.png`,
          mimeType: file.type,
          size: file.size,
          base64Data,
          timestamp: Date.now(),
        };

        // Check storage size limit
        const currentData = getTempImages();
        const totalSize = Object.values(currentData).reduce((sum, img) => sum + img.size, 0) + file.size;

        if (totalSize > MAX_STORAGE_SIZE) {
          reject(new Error("Storage limit exceeded. Please upload existing images first."));
          return;
        }

        // Store in localStorage
        const tempImages = { ...currentData, [id]: imageData };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tempImages));

        console.log("📦 Stored temp image:", { id, fileName: imageData.fileName, size: file.size });

        resolve({
          id,
          url: base64Data, // Return base64 URL for immediate display
          fileName: imageData.fileName,
          mimeType: imageData.mimeType,
          size: file.size,
        });
      } catch (error) {
        console.error("Failed to store temp image:", error);
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Get all temporary images from localStorage
 */
export function getTempImages() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch (error) {
    console.error("Failed to get temp images:", error);
    return {};
  }
}

/**
 * Get a specific temporary image by ID
 */
export function getTempImage(id) {
  const tempImages = getTempImages();
  return tempImages[id] || null;
}

/**
 * Remove a temporary image from localStorage
 */
export function removeTempImage(id) {
  const tempImages = getTempImages();
  delete tempImages[id];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tempImages));
  console.log("🗑️ Removed temp image:", id);
}

/**
 * Clear all temporary images (e.g., on successful form submission)
 */
export function clearAllTempImages() {
  localStorage.removeItem(STORAGE_KEY);
  console.log("🧹 Cleared all temp images");
}

/**
 * Extract temp image IDs from editor content
 */
export function extractTempImageIds(htmlContent) {
  if (!htmlContent) return [];

  // Match data URLs with temp IDs in the content
  const tempIdPattern = /data:image\/[^;]+;base64,[^"'>\s)]+/g;
  const matches = htmlContent.match(tempIdPattern) || [];

  // Get actual temp IDs from stored images
  const tempImages = getTempImages();
  const usedIds = [];

  Object.entries(tempImages).forEach(([id, imageData]) => {
    if (matches.some((match) => match === imageData.base64Data)) {
      usedIds.push(id);
    }
  });

  return usedIds;
}

/**
 * Clean up unused temporary images (call this when content changes)
 */
export function cleanupUnusedTempImages(htmlContent) {
  const usedIds = extractTempImageIds(htmlContent);
  const allTempImages = getTempImages();

  Object.keys(allTempImages).forEach((id) => {
    if (!usedIds.includes(id)) {
      removeTempImage(id);
    }
  });
}

/**
 * Get storage usage statistics
 */
export function getStorageStats() {
  const tempImages = getTempImages();
  const count = Object.keys(tempImages).length;
  const totalSize = Object.values(tempImages).reduce((sum, img) => sum + img.size, 0);

  return {
    count,
    totalSize,
    totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
    percentUsed: ((totalSize / MAX_STORAGE_SIZE) * 100).toFixed(1),
  };
}

/**
 * Convert temporary images to files for upload and replace URLs in form data
 * Called on form submission to handle localStorage images
 */
export async function prepareTempImagesForUpload(formData, uploadFunction, onToast) {
  try {
    console.log("🔍 Frontend: Scanning form data for localStorage images...");

    const tempImages = getTempImages();
    const tempImageIds = Object.keys(tempImages);

    if (tempImageIds.length === 0) {
      console.log("ℹ️ Frontend: No localStorage images found");
      return formData;
    }

    console.log(`📋 Frontend: Found ${tempImageIds.length} localStorage images to process`);

    // Create a deep copy of form data
    const updatedFormData = JSON.parse(JSON.stringify(formData));

    // Track which images are actually used in the form content
    const usedImageIds = [];
    const imageReplacements = new Map();

    // Scan all form fields for base64 image URLs
    Object.keys(updatedFormData).forEach((fieldName) => {
      const fieldValue = updatedFormData[fieldName];

      if (typeof fieldValue === "string" && fieldValue.includes("data:image/")) {
        console.log(`🔍 Frontend: Scanning field "${fieldName}" for localStorage images`);

        // Check if this field contains any of our localStorage images
        tempImageIds.forEach((tempId) => {
          const imageData = tempImages[tempId];
          if (fieldValue.includes(imageData.base64Data)) {
            usedImageIds.push(tempId);
            console.log(`✅ Frontend: Found localStorage image ${tempId} in field ${fieldName}`);
          }
        });
      }
    });

    if (usedImageIds.length === 0) {
      console.log("ℹ️ Frontend: No localStorage images are used in form content");
      return formData;
    }

    console.log(`📤 Frontend: Uploading ${usedImageIds.length} localStorage images...`);
    onToast(`Laster opp ${usedImageIds.length} bilder...`, "info");

    // Upload each used image
    for (const tempId of usedImageIds) {
      const imageData = tempImages[tempId];

      try {
        console.log(`🚀 Frontend: Uploading localStorage image: ${tempId} (${imageData.fileName})`);

        // Convert base64 back to File object
        const response = await fetch(imageData.base64Data);
        const blob = await response.blob();
        const file = new File([blob], imageData.fileName, { type: imageData.mimeType });

        // Create FormData for upload
        const formData = new FormData();
        formData.append("file", file);

        // Upload the image
        const uploadResponse = await uploadFunction(formData);

        if (!uploadResponse?.data?.digitalOceanUrl) {
          throw new Error(`Upload failed for ${imageData.fileName}`);
        }

        const uploadedUrl = uploadResponse.data.digitalOceanUrl;
        console.log(`✅ Frontend: Successfully uploaded ${tempId} to ${uploadedUrl}`);

        // Store the URL replacement mapping
        imageReplacements.set(imageData.base64Data, uploadedUrl);
      } catch (uploadError) {
        console.error(`❌ Frontend: Failed to upload ${tempId}:`, uploadError);
        throw new Error(`Failed to upload ${imageData.fileName}: ${uploadError.message}`);
      }
    }

    // Replace all base64 URLs with uploaded URLs in form data
    Object.keys(updatedFormData).forEach((fieldName) => {
      const fieldValue = updatedFormData[fieldName];

      if (typeof fieldValue === "string") {
        let updatedValue = fieldValue;

        imageReplacements.forEach((uploadedUrl, base64Url) => {
          if (updatedValue.includes(base64Url)) {
            updatedValue = updatedValue.replace(base64Url, uploadedUrl);
            console.log(`🔄 Frontend: Replaced localStorage image URL with uploaded URL in field ${fieldName}`);
          }
        });

        updatedFormData[fieldName] = updatedValue;
      }
    });

    // Clean up localStorage images that were successfully uploaded
    usedImageIds.forEach((tempId) => {
      removeTempImage(tempId);
    });

    console.log("✅ Frontend: All localStorage images uploaded and URLs replaced");
    onToast(`${usedImageIds.length} bilder lastet opp!`, "success");

    return updatedFormData;
  } catch (error) {
    console.error("❌ Frontend: Failed to process localStorage images:", error);
    throw error;
  }
}
