import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  PayloadTooLargeException,
  Req,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { MediaService } from './media.service';
import { JwtAuthGuard, RolesGuard, Roles } from '@libs/common';
import { Role } from '@prisma/client';

@Controller('media')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  /**
   * POST /media/upload
   * Sube una imagen directamente (multipart/form-data).
   * El campo del archivo debe llamarse "file".
   */
  @Post('upload')
  async uploadImage(@Req() req: FastifyRequest) {
    let data: any;
    try {
      data = await (req as any).file();
    } catch (err: any) {
      if (err?.code === 'FST_FILES_LIMIT' || err?.statusCode === 413 || err?.message?.includes('too large')) {
        throw new PayloadTooLargeException('El archivo supera el límite de 10 MB');
      }
      throw err;
    }
    if (!data) throw new BadRequestException('No se recibió ningún archivo');

    const buffer = await data.toBuffer();
    const mimeType: string = data.mimetype;
    const originalName: string = data.filename;

    return this.mediaService.uploadImage(buffer, originalName, mimeType);
  }

  /**
   * POST /media/presign
   * Devuelve una URL prefirmada para que el cliente suba directamente a R2.
   */
  @Post('presign')
  async getPresignedUrl(
    @Body() body: { fileName: string; mimeType: string; folder?: string },
  ) {
    return this.mediaService.getPresignedUploadUrl(
      body.fileName,
      body.mimeType,
      body.folder,
    );
  }

  /**
   * DELETE /media/:key
   * Elimina una imagen del bucket por su key (codificada en base64url).
   */
  @Delete(':key')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteImage(@Param('key') encodedKey: string) {
    const key = Buffer.from(encodedKey, 'base64url').toString('utf8');
    await this.mediaService.deleteImage(key);
  }

  /**
   * GET /media/gallery
   * Devuelve todos los objetos del bucket R2 (key, url, size, lastModified).
   * Ordenados del más reciente al más antiguo.
   */
  @Get('gallery')
  getGallery() {
    return this.mediaService.listAll();
  }
}
