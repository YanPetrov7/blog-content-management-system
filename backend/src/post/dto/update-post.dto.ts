import { PartialType } from '@nestjs/mapped-types';
import { CreatePostDto } from './create-post.dto';
import { IsOptional, IsString } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsOptional()
  @IsString()
  image_small?: string;

  @IsOptional()
  @IsString()
  image_medium?: string;

  @IsOptional()
  @IsString()
  image_large?: string;
}
