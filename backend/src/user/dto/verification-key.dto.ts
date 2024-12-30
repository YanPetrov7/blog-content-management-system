import { IsNotEmpty, IsUUID } from 'class-validator';

export class VerificationKeyDto {
  @IsNotEmpty()
  @IsUUID('4')
  key: string;
}
