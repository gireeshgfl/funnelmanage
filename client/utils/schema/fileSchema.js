// This is the prepended comment
// ===============================================================================
// GoFreeLab Proprietary
// -------------------------------------------------------------------------------
// Project Name    : Funnel management
// File Name       : fileSchema.js
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

import { z } from 'zod';

/**
 * 1. Supported File Types and Base Schema
 */

// Define supported file types and their MIME type regular expressions
export const SupportedFileTypes = {
  video: /^video\//,
  audio: /^audio\//,
  image: /^image\//,
  document: /^(application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.openxmlformats-officedocument.presentationml.presentation|text\/plain)$/,
  code: /^(text\/javascript|text\/css|application\/json|application\/xml|text\/html|text\/x-python|text\/x-java|text\/x-cpp)$/,
  compressed: /^(application\/zip|application\/x-rar-compressed)$/,
  subtitle: /^(application\/vtt|application\/x-subrip)$/,
};

// Base schema for file validation
const baseFileSchema = z.object({
  name: z.string().min(1, { message: 'File name is required' }), // Use min(1) instead of nonempty
  type: z.string().min(1, { message: 'File type is required' }), // Use min(1) instead of nonempty
  size: z.number().positive({ message: 'File size must be a positive number' }),
});

/**
 * 2. Individual File Type Schemas
 */

// Schema for video files
export const VideoSchema = baseFileSchema.extend({
  type: z
    .string()
    .regex(SupportedFileTypes.video, 'File must be a video'),
  size: z
    .number()
    .max(5000 * 1024 * 1024, 'Video size must be less than 500MB'), // 500MB
});

// Schema for audio files
export const AudioSchema = baseFileSchema.extend({
  type: z
    .string()
    .regex(SupportedFileTypes.audio, 'File must be an audio'),
  size: z
    .number()
    .max(100 * 1024 * 1024, 'Audio size must be less than 100MB'), // 100MB
});

// Schema for image files
export const ImageSchema = baseFileSchema.extend({
  type: z
    .string()
    .regex(SupportedFileTypes.image, 'File must be an image'),
  size: z
    .number()
    .max(10 * 1024 * 1024, 'Image size must be less than 10MB'), // 10MB
});

// Schema for document files
export const DocumentSchema = baseFileSchema.extend({
  type: z
    .string()
    .regex(SupportedFileTypes.document, 'File must be a supported document'),
  size: z
    .number()
    .max(20 * 1024 * 1024, 'Document size must be less than 20MB'), // 20MB
});

// Schema for code files
export const CodeSchema = baseFileSchema.extend({
  type: z
    .string()
    .regex(SupportedFileTypes.code, 'File must be a supported code file'),
  size: z
    .number()
    .max(5 * 1024 * 1024, 'Code file size must be less than 5MB'), // 5MB
});

// Schema for compressed files
export const CompressedSchema = baseFileSchema.extend({
  type: z
    .string()
    .regex(SupportedFileTypes.compressed, 'File must be a compressed archive'),
  size: z
    .number()
    .max(100 * 1024 * 1024, 'Compressed file size must be less than 100MB'), // 100MB
});

// Schema for subtitle files
export const SubtitleSchema = baseFileSchema.extend({
  type: z
    .string()
    .regex(SupportedFileTypes.subtitle, 'File must be a subtitle file'),
  size: z
    .number()
    .max(2 * 1024 * 1024, 'Subtitle file size must be less than 2MB'), // 2MB
});

/**
 * 3. Aggregate File Schema
 */

// Union schema for any supported file type
export const AnyFileSchema = z.union([
  VideoSchema,
  AudioSchema,
  ImageSchema,
  DocumentSchema,
  CodeSchema,
  CompressedSchema,
  SubtitleSchema,
], {
  errorMap: (issue, _ctx) => ({
    message: 'Invalid file type or size',
  }),
});

/**
 * 4. ObjectId Validation
 */

// MongoDB ObjectId pattern (24 hexadecimal characters)
const ObjectIdRegex = /^[a-fA-F0-9]{24}$/;

// ObjectId schema
export const ObjectIdSchema = z
  .string()
  .regex(ObjectIdRegex, { message: 'Invalid ObjectId format' }); // Validate the ObjectId format

/**
 * 5. Request Payload Schemas
 */

// Updated schema for uploading a new file using topic id only
export const UploadFilePayloadSchema = z.object({
  _id: ObjectIdSchema, // Topic id
  file: AnyFileSchema,
  extraData: z.object({
    questionText: z.string().optional(),
    answers: z.array(z.string()).optional(),
  }).optional(),
});

/**
 * 6. Extended Resource Schema
 */

// If you use an extended resource schema in your project for topics,
// remove the sectionIndex and itemIndex properties as they are not needed.
export const ExtendedResourceSchema = z.object({
  _id: ObjectIdSchema, // Topic id
  resource: z.object({
    order: z.number(),
    title: z.string(),
    type: z.enum(['link', 'code', 'file']), // Defines the resource types
    file: z.string().optional(), // For file-based resources (file URL or file data)
    fileType: z.string().optional(), // Optional MIME type for files
    fileName: z.string().optional(),
    size: z.number().int().positive().optional(),
    code: z.string().optional(), // For source code-based resources
    url: z.string().optional(), // For link-based resources
  }).refine((data) => {
    // Validate that only one of file, code, or link fields is provided
    const isFile = !!data.file;
    const isCode = !!data.code;
    const isLink = !!data.url;
    const count = [isFile, isCode, isLink].filter(Boolean).length;
    return count === 1;
  }, {
    message: 'Exactly one of file, code, or link must be provided',
  }),
});

/**
 * 7. Schema for replacing an existing file
 */
export const ReplaceFilePayloadSchema = UploadFilePayloadSchema.extend({
  existingFileKey: z
    .string()
    .min(1, { message: 'Existing file key is required for replacement' }), // Ensure the existing file key is non-empty
});
