import { IsNumberString, IsOptional } from 'class-validator';

export class CommentFilterDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;
}
