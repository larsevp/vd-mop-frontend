/**
 * LocalStorage Image Manager
 *
 * Manages images in localStorage for TipTap editor before upload
 */

const STORAGE_KEY = "tiptap_temp_images";
const MAX_STORAGE_SIZE = 4 * 1024 * 1024; // 4MB limit (browser localStorage cap is typically 5-10MB)

/**
 * Generate a unique temporary ID for an image
 */
export function generateTempImageId() {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Compress an image file using canvas.
 * Resizes if wider than maxWidth and converts to JPEG/WebP.
 */
function compressImage(file, { maxWidth = 2400, quality = 0.92 } = {}) {
  return new Promise((resolve) => {
    // Skip compression for small images or SVGs
    if (file.size < 50 * 1024 || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob && blob.size < file.size) {
            resolve(new File([blob], file.name || "image.webp", { type: blob.type }));
          } else {
            resolve(file); // Original was smaller, keep it
          }
        },
        "image/webp",
        quality
      );
    };
    img.onerror = () => resolve(file); // On error, keep original
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Store an image file in localStorage with a temporary ID
 */
export async function storeTempImage(file, tempId = null) {
  const id = tempId || generateTempImageId();

  // Compress before storing
  const compressed = await compressImage(file);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const base64Data = reader.result;
        const imageData = {
          id,
          fileName: compressed.name || `pasted-image-${Date.now()}.webp`,
          mimeType: compressed.type,
          size: compressed.size,
          base64Data,
          timestamp: Date.now(),
        };

        // Check storage size limit
        const currentData = getTempImages();
        const totalSize = Object.values(currentData).reduce((sum, img) => sum + img.size, 0) + compressed.size;

        if (totalSize > MAX_STORAGE_SIZE) {
          // Auto-cleanup images older than 1 hour before rejecting
          const oneHourAgo = Date.now() - 60 * 60 * 1000;
          let cleaned = false;
          Object.entries(currentData).forEach(([imgId, img]) => {
            if (img.timestamp && img.timestamp < oneHourAgo) {
              delete currentData[imgId];
              cleaned = true;
            }
          });
          if (cleaned) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(currentData));
            const newTotal = Object.values(currentData).reduce((sum, img) => sum + img.size, 0) + compressed.size;
            if (newTotal <= MAX_STORAGE_SIZE) {
              // Freed enough space, continue below
            } else {
              reject(new Error("Storage limit exceeded. Please upload existing images first."));
              return;
            }
          } else {
            reject(new Error("Storage limit exceeded. Please upload existing images first."));
            return;
          }
        }

        // Store in localStorage
        const tempImages = { ...currentData, [id]: imageData };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(tempImages));
        } catch (storageError) {
          reject(new Error("Storage limit exceeded. Please upload existing images first."));
          return;
        }

        //console.log("📦 Stored temp image:", { id, fileName: imageData.fileName, size: file.size });

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
  //console.log("🗑️ Removed temp image:", id);
}

/**
 * Clear all temporary images (e.g., on successful form submission)
 */
export function clearAllTempImages() {
  localStorage.removeItem(STORAGE_KEY);
  //console.log("🧹 Cleared all temp images");
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
    //console.log("LOGBACKEND 🔍 === Starting prepareTempImagesForUpload ===");
    //console.log("LOGBACKEND 🔍 Form data keys:", Object.keys(formData));

    const tempImages = getTempImages();
    const tempImageIds = Object.keys(tempImages);

    //console.log(`LOGBACKEND 🔍 Found ${tempImageIds.length} localStorage images:`, tempImageIds);

    if (tempImageIds.length === 0) {
      //console.log("LOGBACKEND ℹ️ No localStorage images to process");
      return formData;
    }

    //console.log(`LOGBACKEND 📋 Processing ${tempImageIds.length} localStorage images...`);

    // Create a deep copy of form data
    const updatedFormData = JSON.parse(JSON.stringify(formData));

    // Track which images are actually used in the form content
    const usedImageIds = [];
    const imageReplacements = new Map();

    // Scan all form fields for base64 image URLs
    Object.keys(updatedFormData).forEach((fieldName) => {
      const fieldValue = updatedFormData[fieldName];

      if (typeof fieldValue === "string" && fieldValue.includes("data:image/")) {
        // Extract all base64 images from the field to see what's actually there
        const base64ImagesInField = fieldValue.match(/data:image\/[^;]+;base64,[^"'\s)]+/g) || [];

        // Check if this field contains any of our localStorage images
        tempImageIds.forEach((tempId) => {
          const imageData = tempImages[tempId];
          const base64Preview = imageData.base64Data.substring(0, 70);

          if (fieldValue.includes(imageData.base64Data)) {
            usedImageIds.push(tempId);
          } else {
          }
        });
      }
    });

    if (usedImageIds.length === 0) {
      // FALLBACK: Handle base64 images that are in the form but NOT in localStorage
      // This happens when:
      // - Page was refreshed (localStorage cleared)
      // - Images were pasted before localStorage was working
      // - Images are from database (editing existing entity)

      const orphanImages = [];
      Object.keys(updatedFormData).forEach((fieldName) => {
        const fieldValue = updatedFormData[fieldName];
        if (typeof fieldValue === "string" && fieldValue.includes("data:image/")) {
          const base64ImagesInField = fieldValue.match(/data:image\/([^;]+);base64,([^"'\s)]+)/g) || [];
          base64ImagesInField.forEach((base64Url) => {
            orphanImages.push({ fieldName, base64Url });
          });
        }
      });

      if (orphanImages.length > 0) {
        // Upload orphan images
        for (const { fieldName, base64Url } of orphanImages) {
          try {
            // Extract mime type and base64 data
            const match = base64Url.match(/data:image\/([^;]+);base64,(.+)/);
            if (!match) continue;

            const mimeType = `image/${match[1]}`;
            const base64Data = match[2];

            // Convert to blob
            const response = await fetch(base64Url);
            const blob = await response.blob();
            const fileName = `orphan-image-${Date.now()}.${match[1]}`;
            const file = new File([blob], fileName, { type: mimeType });

            // Upload
            const formData = new FormData();
            formData.append("file", file);
            const uploadResponse = await uploadFunction(formData);

            if (!uploadResponse?.data?.digitalOceanUrl) {
              throw new Error(`Upload failed for ${fileName}`);
            }

            const uploadedUrl = uploadResponse.data.digitalOceanUrl;

            // Replace in form data
            updatedFormData[fieldName] = updatedFormData[fieldName].replace(base64Url, uploadedUrl);
          } catch (error) {
            console.error(`Failed to upload orphan image:`, error);
          }
        }

        return updatedFormData;
      } else {
        return formData;
      }
    }

    onToast(`Laster opp ${usedImageIds.length} bilder...`, "info");

    // Upload each used image
    for (const tempId of usedImageIds) {
      const imageData = tempImages[tempId];

      try {
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
          throw new Error(`Upload failed for ${imageData.fileName} - no digitalOceanUrl in response`);
        }

        const uploadedUrl = uploadResponse.data.digitalOceanUrl;
        //console.log(`LOGBACKEND ✅ Successfully uploaded ${tempId} to ${uploadedUrl}`);

        // Store the URL replacement mapping
        imageReplacements.set(imageData.base64Data, uploadedUrl);
      } catch (uploadError) {
        console.error(`Failed to upload ${tempId}:`, uploadError);
        throw new Error(`Failed to upload ${imageData.fileName}: ${uploadError.message}`);
      }
    }

    //console.log(`LOGBACKEND ✅ All ${usedImageIds.length} images uploaded. Replacement map size: ${imageReplacements.size}`);

    // Replace all base64 URLs with uploaded URLs in form data
    Object.keys(updatedFormData).forEach((fieldName) => {
      const fieldValue = updatedFormData[fieldName];

      if (typeof fieldValue === "string") {
        let updatedValue = fieldValue;
        let replacementsMade = 0;

        imageReplacements.forEach((uploadedUrl, base64Url) => {
          if (updatedValue.includes(base64Url)) {
            //console.log(`LOGBACKEND ✅ Replacing base64 in ${fieldName} with ${uploadedUrl}`);
            updatedValue = updatedValue.replace(base64Url, uploadedUrl);
            replacementsMade++;
          }
        });

        if (replacementsMade > 0) {
          //console.log(`LOGBACKEND 🔄 Replaced ${replacementsMade} image URLs in ${fieldName}`);
          updatedFormData[fieldName] = updatedValue;
        }
      }
    });

    // Clean up localStorage images that were successfully uploaded
    usedImageIds.forEach((tempId) => {
      removeTempImage(tempId);
    });

    // Clean up orphan localStorage images (images that weren't matched/used)
    const orphanImageIds = tempImageIds.filter((id) => !usedImageIds.includes(id));
    if (orphanImageIds.length > 0) {
      //console.log(`LOGBACKEND 🧹 Cleaning up ${orphanImageIds.length} orphan localStorage images:`, orphanImageIds);
      orphanImageIds.forEach((tempId) => {
        removeTempImage(tempId);
      });
    }

    //console.log("LOGBACKEND ✅ All localStorage images uploaded and URLs replaced");
    onToast(`${usedImageIds.length} bilder lastet opp!`, "success");

    return updatedFormData;
  } catch (error) {
    console.error("Failed to process localStorage images:", error);
    throw error;
  }
}
