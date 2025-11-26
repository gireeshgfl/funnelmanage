// /home/expertzlab/Work/funnel_management/client/hooks/useFileUpload.js
// ===============================================================================
// GoFreeLab Proprietary
// -------------------------------------------------------------------------------
// Project Name    : Funnel management
// File Name       : useFileUpload.js
// Author          : Sabari Santhosh Pillai
// Created Date    : 2025-02-24
// Version         : 1.1 (Updated)
// -------------------------------------------------------------------------------
// Copyright (c) 2025 GoFreeLab. All rights reserved.
// Unauthorized copying, sharing, or distribution is strictly prohibited.
// For permissions, contact: info@gofreelab.com
// ===============================================================================

import { useState } from 'react';
import axios from 'axios';
import { API_ROUTES } from '@/config';

const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileUploaded, setFileUploaded] = useState(false);
  const [fileUrl, setFileUrl] = useState(null);

  /**
   * Uploads a file to the backend and S3, triggers HLS conversion if it's a video
   * @param {File} file - The file to upload
   * @param {Object} options - { topicId, existingFileKey (optional), extraData (optional) }
   * @param {function} onProgress - Optional callback for upload progress
   * @returns {Object} - Result containing success status, file key, and URL if uploaded
   */
  const uploadFile = async (file, options, onProgress) => {
    const { topicId, existingFileKey, extraData } = options;

    try {
      setUploading(true);
      setFileUploaded(false);
      setUploadProgress(0);

      // Prepare the request payload
      const payload = {
        _id: topicId,
        file: {
          name: file.name,
          type: file.type,
          size: file.size,
        },
        ...(extraData && { extraData }),
      };

      if (existingFileKey) {
        payload.existingFileKey = existingFileKey;
      }

      console.log("[useFileUpload] Payload for upload:", payload);

      const endpoint = existingFileKey
        ? API_ROUTES.MEDIA_SERVICE.REPLACE_COURSE_IMAGE
        : API_ROUTES.MEDIA_SERVICE.UPLOAD;

      console.log("[useFileUpload] Sending POST request to:", endpoint);

      // Request presigned URL from backend
      const response = await axios.post(endpoint, payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      console.log("[useFileUpload] Presigned URL response:", response.data);

      if (response.status === 201) {
        // Extract presignedUrl and nested key from the response
        const { presignedUrl, data: metadata } = response.data;
        const key = metadata.resource.key;
        console.log("[useFileUpload] Presigned URL:", presignedUrl, "Key:", key);

        // Check if key is properly defined
        if (!key) {
          console.error("[useFileUpload] Error: No key returned from backend.");
          throw new Error("No key returned from backend");
        }

        // Upload the file to S3 using presigned URL
        const uploadResponse = await axios.put(presignedUrl, file, {
          headers: { 'Content-Type': file.type },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(progress);
            if (onProgress) onProgress(progress);
            console.log(`[useFileUpload] Upload progress: ${progress}%`);
          },
        });

        console.log("[useFileUpload] S3 upload response:", uploadResponse.status);

        if (uploadResponse.status === 200) {
          // Remove any trailing slash from the bucket URL to prevent double slash
          const bucketUrl = process.env.NEXT_PUBLIC_S3_BUCKET_URL.replace(/\/+$/, "");
          const newFileUrl = `${bucketUrl}/${key}`;
          setFileUrl(newFileUrl);
          setFileUploaded(true);
          console.log("[useFileUpload] File successfully uploaded. URL:", newFileUrl);

          // Only trigger HLS conversion if the uploaded file is a video
          if (file.type.startsWith('video/')) {
            try {
              const hlsResponse = await axios.post(
                API_ROUTES.VIDEO_SERVICE.CONVERT_TO_HLS,
                {
                  videoName: file.name,
                  key,
                }
              );
              console.log("[useFileUpload] HLS conversion triggered:", hlsResponse.data);
            } catch (hlsError) {
              console.error("[useFileUpload] Error triggering HLS conversion:", hlsError);
            }
          }

          return { success: true, key, url: newFileUrl };
        }
      }

      console.error("[useFileUpload] Upload failed with response:", response.data);
      return {
        success: false,
        message: response.data.message || 'Upload failed.',
      };
    } catch (error) {
      console.error("[useFileUpload] Error uploading file:", error);
      return {
        success: false,
        message: error.response?.data?.message || 'An unexpected error occurred.',
      };
    } finally {
      setUploading(false);
      console.log("[useFileUpload] Upload process completed.");
    }
  };

  return { uploadFile, uploading, uploadProgress, fileUploaded, fileUrl };
};

export default useFileUpload;
