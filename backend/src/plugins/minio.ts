import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { Client as MinioClient } from 'minio';

declare module 'fastify' {
  interface FastifyInstance {
    minio: MinioClient;
  }
}

export const minioPlugin = fp(async (app: FastifyInstance) => {
  const minio = new MinioClient({
    endPoint: process.env.MINIO_ENDPOINT ?? 'localhost',
    port: Number(process.env.MINIO_PORT ?? 9000),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  });

  // Pastikan bucket ada
  const buckets = [
    process.env.MINIO_BUCKET_PUBLIC ?? 'buruan-sae-public',
    process.env.MINIO_BUCKET_PRIVATE ?? 'buruan-sae-private',
  ];

  for (const bucket of buckets) {
    const exists = await minio.bucketExists(bucket);
    if (!exists) {
      await minio.makeBucket(bucket, 'us-east-1');
      // Set public bucket policy
      if (bucket.includes('public')) {
        const policy = JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { AWS: ['*'] },
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucket}/*`],
          }],
        });
        await minio.setBucketPolicy(bucket, policy);
      }
      app.log.info(`✅ MinIO bucket '${bucket}' dibuat`);
    }
  }

  app.log.info('✅ MinIO terhubung');
  app.decorate('minio', minio);
});
