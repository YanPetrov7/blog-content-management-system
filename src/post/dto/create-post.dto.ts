import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
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

  @IsInt()
  @IsNotEmpty()
  author_id: number;

  @IsInt()
  @IsOptional()
  category_id?: number;

  @IsBoolean()
  @IsOptional()
  is_published: boolean;
}
