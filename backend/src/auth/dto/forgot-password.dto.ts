import { IsString, MinLength } from 'class-validator';

export class ForgotPasswordDto {
  @IsString()
  identifier: string; // email or mobile
}

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}