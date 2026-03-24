import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import * as path from 'path';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

@Injectable()
export class MediaService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(private readonly config: ConfigService) {
    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.getOrThrow<string>('R2_ACCOUNT_ID')}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
        secretAccessKey: config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
      },
    });
    this.bucket = config.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrl = config.getOrThrow<string>('R2_PUBLIC_URL');
  }

  /**
   * Sube un buffer al bucket R2 y devuelve la URL pública.
   */
  async uploadImage(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    folder = 'products',
  ): Promise<{ key: string; url: string }> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException(
        `Tipo de archivo no permitido. Usar: ${ALLOWED_MIME_TYPES.join(', ')}`,
      );
    }

    if (buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException('El archivo no puede superar 5 MB');
    }

    const ext = path.extname(originalName).toLowerCase() || '.jpg';
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
      }),
    );

    return { key, url: `${this.publicUrl}/${key}` };
  }

  /**
   * Genera una URL prefirmada para subir directamente desde el frontend (opcional).
   */
  async getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder = 'products',
  ): Promise<{ uploadUrl: string; key: string; publicUrl: string }> {
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      throw new BadRequestException('Tipo de archivo no permitido');
    }

    const ext = path.extname(fileName).toLowerCase() || '.jpg';
    const key = `${folder}/${randomUUID()}${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: mimeType,
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });

    return { uploadUrl, key, publicUrl: `${this.publicUrl}/${key}` };
  }

  /**
   * Elimina un objeto del bucket.
   */
  async deleteImage(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      }),
    );
  }

  /**
   * Lista todos los objetos en el bucket R2 con metadata básica.
   */
  async listAll(): Promise<Array<{ key: string; url: string; size: number; lastModified: string }>> {
    const items: Array<{ key: string; url: string; size: number; lastModified: string }> = [];
    let continuationToken: string | undefined;

    do {
      const res = await this.s3.send(
        new ListObjectsV2Command({
          Bucket: this.bucket,
          ContinuationToken: continuationToken,
        }),
      );
      res.Contents?.forEach((obj) => {
        if (obj.Key) {
          items.push({
            key: obj.Key,
            url: `${this.publicUrl}/${obj.Key}`,
            size: obj.Size ?? 0,
            lastModified: obj.LastModified?.toISOString() ?? '',
          });
        }
      });
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    // Más recientes primero
    return items.sort((a, b) => b.lastModified.localeCompare(a.lastModified));
  }
}
