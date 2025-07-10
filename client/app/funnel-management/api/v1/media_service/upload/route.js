import { NextResponse } from 'next/server';
import { handleRequestComprehensive } from '@utils/auth/processrequest';
import { UploadFilePayloadSchema } from '@utils/schema/fileSchema';
import { handlePost } from '@utils/synchrnousPost';
import { getPresignedUrl } from '@utils/s3';

export async function POST(request) {
  try {
    const result = await handleRequestComprehensive(request, UploadFilePayloadSchema);
    if (result instanceof NextResponse) {
      return result;
    }

    const { data, service, method } = result;
    console.log("Data received in API route:", data);

    // Destructure values from data
    const { _id, file, extraData } = data;
    console.log("Topic ID:", _id);
    console.log("File received:", file);
    console.log("Extra Data received:", extraData);

    // Generate the presigned URL for file upload
    const { presignedUrl, key } = await getPresignedUrl({
      fileType: file.type,
      originalFileName: file.name,
    });

    console.log("Presigned URL generated:", presignedUrl, "Key:", key);

    // Update the data object directly with a new resource property
    data.resource = {
      key,
      fileType: (() => {
        if (/^video\//.test(file.type)) return 'video';
        if (/^audio\//.test(file.type)) return 'audio';
        if (/^image\//.test(file.type)) return 'image';
        if (/^(application\/pdf|application\/vnd.openxmlformats-officedocument.wordprocessingml.document|application\/vnd.openxmlformats-officedocument.presentationml.presentation|text\/plain)/.test(file.type)) return 'document';
        if (/^(text\/javascript|text\/css|application\/json|application\/xml|text\/html|text\/x-python|text\/x-java|text\/x-cpp)/.test(file.type)) return 'code';
        if (/^(application\/zip|application\/x-rar-compressed)/.test(file.type)) return 'compressed';
        if (/^(application\/vtt|application\/x-subrip)/.test(file.type)) return 'subtitle';
        return 'other';
      })(),
      size: file.size,
      ...(extraData && { extraData }),
    };

    // Pass the entire data object directly to handlePost
    const postResult = await handlePost(data, service, "update_topic_file_metadata");

    console.log("PostResult from handlePost:", postResult);

    if (postResult.status !== 200) {
      console.error("Failed to update topic file metadata:", postResult);
      return NextResponse.json({ error: 'Failed to update topic file metadata' }, { status: 400 });
    }

    return NextResponse.json({ ...postResult, presignedUrl }, { status: 201 });

  } catch (error) {
    console.error('Error in API route:', error);
    if (error.message === 'Failed to generate presigned URL') {
      return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
    return NextResponse.json({ error: 'An unexpected error occurred', details: error.message }, { status: 500 });
  }
}
