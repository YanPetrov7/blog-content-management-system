import { IsDate, IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateVerificationKeyDto {
  @IsNotEmpty()
  @IsUUID('4')
  key: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsDate()
  expires_at: Date;
}
