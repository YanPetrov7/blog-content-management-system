import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class VerificationDataDto {
  @IsNotEmpty()
  @IsUUID('4')
  key: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;
}
