import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME;

async function generatePresignedUrl(fileName) {
  const key = `questions/${Date.now()}-${fileName}`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: 'application/octet-stream',
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  console.log('Generated presigned URL:', url);
  return { url, key };
}

export async function POST(req) {
  try {
    const formData = await req.formData();
    console.log('Form parsing completed');

    const questionType = formData.get('questionType');
    const questionText = formData.get('questionText');
    const questionFileName = formData.get('questionFileName');
    const correctAnswerIndex = formData.get('correctAnswerIndex');
    const topicId = formData.get('topicId');

    if (!questionType || !topicId) {
      console.error('Missing required fields');
      return NextResponse.json(
        { status: 'error', message: 'Missing required fields' },
        { status: 400 }
      );
    }

    let questionFileData = null;
    if (questionFileName) {
      questionFileData = await generatePresignedUrl(questionFileName);
    }

    const answers = [];
    const points = [];
    for (let i = 0; i < 4; i++) {
      const answerText = formData.get(`answerText${i}`);
      const point = formData.get(`points${i}`);
      points.push(point ? parseInt(point, 10) : 0);

      let answerFileData = null;
      if (questionType === 'image-image') {
        const answerFileName = formData.get(`answerFileName${i}`);
        if (answerFileName) {
          answerFileData = await generatePresignedUrl(answerFileName);
        }
      }

      answers.push({
        text: answerText || '',
        fileData: answerFileData
      });
    }

    const questionData = {
      questionType,
      questionText,
      questionFileData,
      answers,
      points,
      correctAnswerIndex: parseInt(correctAnswerIndex, 10),
      topicId,
      createdAt: new Date(),
    };

    console.log('Question data being sent to Flask:', JSON.stringify(questionData, null, 2));

    const flaskApiUrl = `${process.env.API_PATH}/add-question`;

    const response = await fetch(flaskApiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData),
      next: { revalidate: 1 }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { status: 'error', message: 'Failed to save question', data: errorData },
        { status: response.status }
      );
    }

    const savedQuestionData = await response.json();

    console.log('Question saved:', savedQuestionData);

    console.log('Operations completed successfully, about to send response');
    return NextResponse.json({
      message: 'Question saved successfully',
      savedQuestion: savedQuestionData,
      presignedUrls: {
        question: questionFileData,
        answers: answers.map(a => a.fileData).filter(Boolean)
      },
      sentData: questionData
    });
  } catch (error) {
    console.error('Detailed error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { status: 'error', message: 'Failed to save question', error: error.message, stack: error.stack },
      { status: 500 }
    );
  }
}