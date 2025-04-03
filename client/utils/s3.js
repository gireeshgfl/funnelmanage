// This is the prepended comment
// ===============================================================================
// GoFreeLab Proprietary
// -------------------------------------------------------------------------------
// Project Name    : Funnel management
// File Name       : s3.js
// Author          : Sabari Santhosh Pillai
// Created Date    : 2025-02-24
// Version         : 1.0
// -------------------------------------------------------------------------------
// Copyright (c) 2025 GoFreeLab. All rights reserved.
// This source code and all its contents are the proprietary property of GoFreeLab.
// Unauthorized copying, sharing, or distribution of this code, in whole or in part,
// via any medium is strictly prohibited without prior written permission from GoFreeLab.
// This software is for use only by employees, contractors, or partners of GoFreeLab
// with explicit authorization. For questions or permissions, please contact: info@gofreelab.com
// ===============================================================================
// utils/s3.js

import { v4 as uuidv4 } from 'uuid';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';

// Initialize the S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Generate a unique file name
export const generateUniqueFileName = (originalFileName) => {
  const parsed = path.parse(originalFileName);
  const fullExtensionMatch = originalFileName.match(/(\.[^.]+)+$/);
  const fullExtension = fullExtensionMatch ? fullExtensionMatch[0] : parsed.ext || '';
  const sanitizedExtension = fullExtension.replace(/[^a-zA-Z0-9.]/g, '');
  const uniqueName = `${uuidv4()}_${Date.now()}${sanitizedExtension}`;
  return uniqueName;
};

// Determine S3 folder based on file type
export const getS3Folder = (fileType) => {
  if (/^video\//.test(fileType)) return 'videos/';
  if (/^audio\//.test(fileType)) return 'audios/';
  if (/^image\//.test(fileType)) return 'images/';
  if (/^(application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.openxmlformats-officedocument.presentationml.presentation|text\/plain)/.test(fileType)) return 'documents/';
  if (/^(text\/javascript|text\/css|application\/json|application\/xml|text\/html|text\/x-python|text\/x-java|text\/x-cpp)/.test(fileType)) return 'code/';
  if (/^(application\/zip|application\/x-rar-compressed)/.test(fileType)) return 'compressed/';
  if (/^(application\/vtt|application\/x-subrip)/.test(fileType)) return 'subtitles/';
  return 'others/';
};

// Get presigned URL
export const getPresignedUrl = async ({ fileType, originalFileName }) => {
  try {
    console.log(`Original Filename: ${originalFileName}`);
    const uniqueFileName = generateUniqueFileName(originalFileName);
    const folder = getS3Folder(fileType);
    const Key = `${folder}${uniqueFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
    return { presignedUrl, key: Key };
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate presigned URL');
  }
};

// Delete file from S3
export const deleteFileFromS3 = async (key) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
    });
    await s3Client.send(command);
    console.log(`Successfully deleted file: ${key}`);
  } catch (error) {
    console.error('Error deleting file from S3:', error);
    throw new Error('Failed to delete file from S3');
  }
};
