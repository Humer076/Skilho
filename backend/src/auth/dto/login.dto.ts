import { IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  identifier: string; // email or mobile number

  @IsString()
  password: string;
}