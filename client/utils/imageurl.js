import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

export async function getPresignedUrl(filePath) {
    // Remove the leading slash and bucket name from the file path
    const key = filePath.replace(/^\/eduvocate\//, '');

    try {
        // Check if the object exists
        const headCommand = new HeadObjectCommand({
            Bucket: 'eduvocate',
            Key: key,
        });

        await s3Client.send(headCommand); // Will throw an error if the object does not exist

        // Generate a presigned URL with an expiration time of 1 hour (3600 seconds)
        const command = new GetObjectCommand({
            Bucket: 'eduvocate',
            Key: key,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        return presignedUrl;
    } catch (error) {
        if (error.name === 'NotFound') {
            console.error('Object not found:', key);
            return key;
        } else {
            console.error('S3 presigned URL error for key:', key, error);
            throw new Error('Failed to get presigned URL from S3');
        }
    }
}
