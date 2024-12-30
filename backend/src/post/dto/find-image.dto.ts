import { IsNotEmpty, IsNumberString, IsString } from 'class-validator';

export class FindImageDto {
  @IsNumberString()
  @IsNotEmpty()
  id: number;

  @IsString()
  @IsNotEmpty()
  image_id: string;
}
