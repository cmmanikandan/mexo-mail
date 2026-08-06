/**
 * MEXO Mail Cloudinary File Storage Service
 *
 * Cloud Name: dughdt8sf
 * Upload Preset: qubink_uploads
 * API Key: 653356226116288
 */

const getEnv = (): Record<string, string | undefined> => {
  try {
    return ((import.meta as any)?.env || {}) as Record<string, string | undefined>;
  } catch {
    return {};
  }
};

const getCloudName = (): string => {
  const env = getEnv();
  return (
    env.VITE_CLOUDINARY_CLOUD_NAME ||
    env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    'dughdt8sf'
  );
};

const getUploadPreset = (): string => {
  const env = getEnv();
  return (
    env.VITE_CLOUDINARY_UPLOAD_PRESET ||
    env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ||
    'qubink_uploads'
  );
};

const getApiKey = (): string => {
  const env = getEnv();
  return (
    env.VITE_CLOUDINARY_API_KEY ||
    env.NEXT_PUBLIC_CLOUDINARY_API_KEY ||
    '653356226116288'
  );
};

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
  resource_type: string;
  original_filename: string;
}

/**
 * Uploads a raw file or image directly to Cloudinary storage via REST API.
 * Supports upload progress callback.
 */
export const uploadFileToCloudinary = async (
  file: File,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> => {
  const cloudName = getCloudName();
  const uploadPreset = getUploadPreset();
  const apiKey = getApiKey();

  const isImage = file.type.startsWith('image/');
  const resourceType = isImage ? 'image' : 'raw';

  const primaryEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;
  const autoEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  const buildFormData = () => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', uploadPreset);
    if (apiKey) fd.append('api_key', apiKey);
    return fd;
  };

  const executeUpload = (url: string): Promise<CloudinaryUploadResult> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);

      if (onProgress) {
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const percent = Math.round((e.loaded / e.total) * 100);
            onProgress(percent);
          }
        };
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              secure_url: data.secure_url,
              public_id: data.public_id,
              bytes: data.bytes || file.size,
              format: data.format || file.name.split('.').pop() || '',
              resource_type: data.resource_type || resourceType,
              original_filename: data.original_filename || file.name,
            });
          } catch {
            reject(new Error('Failed to parse Cloudinary response JSON'));
          }
        } else {
          reject(new Error(`Cloudinary upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
      };

      xhr.onerror = () => reject(new Error('Cloudinary upload network request failed'));
      xhr.send(buildFormData());
    });
  };

  try {
    return await executeUpload(primaryEndpoint);
  } catch (err) {
    // If primary endpoint fails, fallback to auto resource type endpoint
    console.warn('Cloudinary primary upload endpoint error. Trying auto endpoint...', err);
    return await executeUpload(autoEndpoint);
  }
};

/**
 * Uploads a pre-cropped Blob (e.g. from canvas.toBlob) directly to Cloudinary.
 * Use this for avatar uploads — avoids sending the large raw original.
 */
export const uploadBlobToCloudinary = async (
  blob: Blob,
  filename: string,
  onProgress?: (percent: number) => void
): Promise<CloudinaryUploadResult> => {
  const file = new File([blob], filename, { type: blob.type || 'image/webp' });
  return uploadFileToCloudinary(file, onProgress);
};

