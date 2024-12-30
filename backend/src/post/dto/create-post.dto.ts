import {
  IsBoolean,
  IsNotEmpty,
  IsNumberString,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsNumberString()
  @IsNotEmpty()
  author_id: number;

  @IsNumberString()
  @IsOptional()
  category_id?: number;

  @IsBoolean()
  @IsOptional()
  is_published: boolean;

  @IsOptional()
  image?: Express.Multer.File;
}
