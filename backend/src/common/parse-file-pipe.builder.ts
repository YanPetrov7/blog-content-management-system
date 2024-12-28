import { ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';

const MAX_IMAGE_ISZE_IN_BYTES = 1024 * 1024;

export const createFileValidationPipe = () => {
  return new ParseFilePipeBuilder()
    .addFileTypeValidator({ fileType: /(jpeg|png|gif)$/ })
    .addMaxSizeValidator({ maxSize: MAX_IMAGE_ISZE_IN_BYTES })
    .build({
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
    });
};
