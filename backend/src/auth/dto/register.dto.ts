import { IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  mobile?: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsIn(['EMPLOYER', 'EMPLOYEE'])
  role: 'EMPLOYER' | 'EMPLOYEE';

  @IsOptional()
  @IsString()
  companyName?: string;
}