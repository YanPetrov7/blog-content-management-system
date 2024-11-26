import { IsString } from 'class-validator';

export class OperationResultDto {
  @IsString()
  status: string;

  message: string | Array<string>;
}
