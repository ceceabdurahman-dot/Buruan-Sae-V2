import { FastifyInstance, FastifyRequest } from 'fastify';
import { randomUUID } from 'crypto';
import sharp from 'sharp';
import path from 'path';

// ============================================================
// Upload Service — MinIO Object Storage
// ============================================================

type BucketType = 'public' | 'private';

const ALLOWED_MIMES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const TARGET_WIDTH = 1280;
const THUMBNAIL_WIDTH = 400;

export class UploadService {
  private readonly publicBucket: string;
  private readonly privateBucket: string;
  private readonly minioEndpoint: string;

  constructor(private readonly app: FastifyInstance) {
    this.publicBucket = process.env.MINIO_BUCKET_PUBLIC ?? 'buruan-sae-public';
    this.privateBucket = process.env.MINIO_BUCKET_PRIVATE ?? 'buruan-sae-private';
    this.minioEndpoint = `${process.env.MINIO_USE_SSL === 'true' ? 'https' : 'http'}://${process.env.MINIO_ENDPOINT ?? 'localhost'}:${process.env.MINIO_PORT ?? 9000}`;
  }

  /**
   * Upload gambar dengan resize otomatis (sharp)
   */
  async uploadGambar(
    buffer: Buffer,
    mimetype: string,
    folder: string,
    bucket: BucketType = 'public'
  ): Promise<{ url: string; thumbnail_url: string; nama_file: string }> {
    // Validasi MIME
    if (!ALLOWED_MIMES.includes(mimetype)) {
      throw { statusCode: 400, message: 'Format file tidak didukung. Gunakan JPEG, PNG, atau WebP.' };
    }

    // Validasi ukuran
    if (buffer.length > MAX_SIZE_BYTES) {
      throw { statusCode: 400, message: `Ukuran file melebihi batas ${MAX_SIZE_BYTES / 1024 / 1024} MB` };
    }

    const id = randomUUID();
    const namaFile = `${folder}/${id}.webp`;
    const namaThumbnail = `${folder}/thumb_${id}.webp`;
    const bucketName = bucket === 'public' ? this.publicBucket : this.privateBucket;

    // Konversi ke WebP dengan kompresi (kurangi ukuran bandwidth)
    const [imageBuffer, thumbnailBuffer] = await Promise.all([
      sharp(buffer)
        .resize(TARGET_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),
      sharp(buffer)
        .resize(THUMBNAIL_WIDTH, null, { withoutEnlargement: true })
        .webp({ quality: 70 })
        .toBuffer(),
    ]);

    // Upload ke MinIO secara paralel
    await Promise.all([
      this.app.minio.putObject(bucketName, namaFile, imageBuffer, imageBuffer.length, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
      }),
      this.app.minio.putObject(bucketName, namaThumbnail, thumbnailBuffer, thumbnailBuffer.length, {
        'Content-Type': 'image/webp',
        'Cache-Control': 'public, max-age=31536000',
      }),
    ]);

    const baseUrl = bucket === 'public'
      ? `${this.minioEndpoint}/${bucketName}`
      : await this.buatPresignedUrl(bucketName, namaFile);

    return {
      url: `${this.minioEndpoint}/${bucketName}/${namaFile}`,
      thumbnail_url: `${this.minioEndpoint}/${bucketName}/${namaThumbnail}`,
      nama_file: namaFile,
    };
  }

  /**
   * Upload dokumen PDF/Excel (private bucket, presigned URL)
   */
  async uploadDokumen(
    buffer: Buffer,
    mimetype: string,
    originalName: string,
    folder: string
  ): Promise<{ presigned_url: string; nama_file: string }> {
    const ALLOWED_DOC_MIMES = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!ALLOWED_DOC_MIMES.includes(mimetype)) {
      throw { statusCode: 400, message: 'Dokumen hanya boleh PDF atau XLSX' };
    }

    const ext = path.extname(originalName) || '.pdf';
    const namaFile = `${folder}/${randomUUID()}${ext}`;

    await this.app.minio.putObject(
      this.privateBucket,
      namaFile,
      buffer,
      buffer.length,
      { 'Content-Type': mimetype }
    );

    const presignedUrl = await this.buatPresignedUrl(this.privateBucket, namaFile);
    return { presigned_url: presignedUrl, nama_file: namaFile };
  }

  /**
   * Buat presigned URL (berlaku 1 jam)
   */
  async buatPresignedUrl(bucket: string, namaFile: string, expiryDetik = 3600): Promise<string> {
    return this.app.minio.presignedGetObject(bucket, namaFile, expiryDetik);
  }

  /**
   * Hapus file dari MinIO
   */
  async hapusFile(namaFile: string, bucket: BucketType = 'public'): Promise<void> {
    const bucketName = bucket === 'public' ? this.publicBucket : this.privateBucket;
    await this.app.minio.removeObject(bucketName, namaFile);
  }

  /**
   * Parse multipart upload dari Fastify request
   */
  async parseMultipart(request: FastifyRequest): Promise<{ buffer: Buffer; mimetype: string; filename: string }> {
    const file = await request.file();
    if (!file) throw { statusCode: 400, message: 'Tidak ada file yang diunggah' };

    const chunks: Buffer[] = [];
    for await (const chunk of file.file) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    return {
      buffer,
      mimetype: file.mimetype,
      filename: file.filename,
    };
  }
}
