import * as sharp from 'sharp';

export interface ProcessedImageDto {
  buffer: Buffer;
  format: string;
}

export async function processImage(
  file: Express.Multer.File,
): Promise<ProcessedImageDto> {
  const format = file.mimetype;

  const image = sharp(file.buffer).resize(256, 256);

  switch (format) {
    case 'image/png':
      return {
        buffer: await image.png({ compressionLevel: 9 }).toBuffer(),
        format: 'image/png',
      };
    case 'image/jpeg':
      return {
        buffer: await image.jpeg({ quality: 80 }).toBuffer(),
        format: 'image/jpeg',
      };
    case 'image/gif':
      return {
        buffer: await image.gif().toBuffer(),
        format: 'image/gif',
      };
    default:
      throw new Error(`Unsupported image format: ${format}`);
  }
}
