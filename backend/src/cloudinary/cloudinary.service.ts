import { Inject, Injectable } from '@nestjs/common';
import {
  UploadApiResponse,
  UploadApiErrorResponse,
  v2 as Cloudinary,
} from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject('CLOUDINARY') private readonly cloudinary: typeof Cloudinary,
  ) {}

  async getImageUrl(publicId: string): Promise<string> {
    return this.cloudinary.url(publicId, { secure: true });
  }

  async uploadImage(
    fileBuffer: Buffer,
    folder: string,
  ): Promise<UploadApiResponse> {
    const streamToPromise = (buffer: Buffer): Promise<UploadApiResponse> => {
      return new Promise((resolve, reject) => {
        const stream = this.cloudinary.uploader.upload_stream(
          { folder },
          (error: UploadApiErrorResponse, result: UploadApiResponse) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          },
        );
        stream.end(buffer);
      });
    };

    return await streamToPromise(fileBuffer);
  }

  async deleteImage(
    publicId: string,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.cloudinary.uploader.destroy(publicId);
    return { success: result.result === 'ok', message: result.result };
  }
}
