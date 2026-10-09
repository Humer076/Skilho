import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class EmployeeSignupOtpRequestDto {
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  mobile?: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
}

export class EmployeeSignupOtpVerifyDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  otp: string;
}