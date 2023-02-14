import AWS from 'aws-sdk';
import stream from 'stream';

interface UploadStreamOptions {
  Key: string;
  Metadata?: AWS.S3.Metadata;
  ContentType: string;
}

export const uploadStream = ({ Key, Metadata = {}, ContentType }: UploadStreamOptions) => {
  const s3 = new AWS.S3({
    region: 'us-east-2',
    credentials: {
      accessKeyId: process.env.S3_AWS_ACCESS_ID as string,
      secretAccessKey: process.env.S3_AWS_ACCESS_SECRET as string,
    },
  });

  const pass = new stream.PassThrough();

  return {
    writeStream: pass,
    promise: s3
      .upload({
        ContentType,
        Bucket: process.env.S3_METADATA_BUCKET as string,
        Key,
        Body: pass,
        Metadata,
      })
      .promise(),
  };
};
