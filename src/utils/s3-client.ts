import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({});
const BUCKET_NAME = process.env.S3_BUCKET_NAME || '';

export async function generateUploadUrl(userId: string): Promise<{ uploadUrl: string; s3Key: string }> {
  const s3Key = `profile-pictures/${userId}/${uuidv4()}.jpg`;
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: 'image/jpeg',
  });
  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  return { uploadUrl, s3Key };
}

export async function generateDownloadUrl(s3Key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
  });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
