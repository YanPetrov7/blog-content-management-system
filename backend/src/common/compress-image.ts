import * as sharp from 'sharp';

export async function compressImage(
  file: Express.Multer.File,
): Promise<Buffer> {
  return sharp(file.buffer).resize(256, 256).toBuffer();
}
