// /home/expertzlab/Work/funnel_management/client/hooks/useMediaUpload.js
// ===============================================================================
// GoFreeLab Proprietary
// -------------------------------------------------------------------------------
// Project Name    : Funnel management
// File Name       : useMediaUpload.js
// Author          : Sabari Santhosh Pillai
// Created Date    : 2025-02-24
// Version         : 1.2 (Updated)
// -------------------------------------------------------------------------------
// Copyright (c) 2025 GoFreeLab. All rights reserved.
// Unauthorized copying, sharing, or distribution is strictly prohibited.
// For permissions, contact: info@gofreelab.com
// ===============================================================================

import useFileUpload from './useFIleUpload';

const useMediaUpload = () => {
  const { uploadFile } = useFileUpload();

  /**
   * Uploads media for the question and answers.
   * @param {File} questionFile - The File for the question media.
   * @param {Array} answerFiles - Array of Files for the answers (can contain nulls).
   * @param {string} topicId - The topic identifier.
   * @param {Object} extraOptions - Optional extra options. For example: { extraData: { questionText, answers } }
   * @returns {Object} - { questionMediaUrl, answerMediaUrls }
   */
  const uploadQuestionMedia = async (questionFile, answerFiles, topicId, extraOptions = {}) => {
    // Upload question file with extraData if provided.
    const questionMediaResult = await uploadFile(questionFile, { topicId, extraData: extraOptions.extraData });
    if (!questionMediaResult.success) {
      throw new Error("Question media upload failed: " + questionMediaResult.message);
    }
    const questionMediaUrl = questionMediaResult.url;

    // For answer media, if any answer file exists (image-image type expected)
    let answerMediaUrls = [null, null, null, null];
    if (answerFiles && answerFiles.some(file => file !== null)) {
      answerMediaUrls = await Promise.all(
        answerFiles.map(async (file) => {
          if (file) {
            const res = await uploadFile(file, { topicId, extraData: extraOptions.extraData });
            return res.success ? res.url : null;
          }
          return null;
        })
      );
    }
    return { questionMediaUrl, answerMediaUrls };
  };

  return { uploadQuestionMedia };
};

export default useMediaUpload;
