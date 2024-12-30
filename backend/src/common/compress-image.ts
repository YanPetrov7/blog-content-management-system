import * as sharp from 'sharp';

export interface ProcessedImagesDto {
  images: Buffer[];
  format: string;
}

export interface ProcessedImageDto {
  buffer: Buffer;
  format: string;
}

export async function processImage(
  file: Express.Multer.File,
): Promise<ProcessedImagesDto> {
  const format = file.mimetype;

  const sizes = [
    { name: 'small', width: 128, height: 128 },
    { name: 'medium', width: 512, height: 512 },
    { name: 'large', width: 1440, height: 1440 },
  ];

  let processedImage: sharp.Sharp;
  switch (format) {
    case 'image/png':
      processedImage = sharp(file.buffer).png({ compressionLevel: 9 });
      break;
    case 'image/jpeg':
      processedImage = sharp(file.buffer).jpeg({ quality: 80 });
      break;
    case 'image/gif':
      processedImage = sharp(file.buffer).gif();
      break;
    default:
      throw new Error(`Unsupported image format: ${format}`);
  }

  const promises = sizes.map(async (size) => {
    return processedImage.clone().resize(size.width, size.height).toBuffer();
  });

  const resizedImagesBuffers = await Promise.all(promises);

  console.log('resizedImagesBuffers', resizedImagesBuffers);

  return {
    images: resizedImagesBuffers,
    format,
  };
}
