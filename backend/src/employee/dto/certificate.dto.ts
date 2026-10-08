import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CertificateDto {
  @IsString() @MinLength(2) @MaxLength(150)
  name: string;

  @IsOptional() @IsString() @MaxLength(150)
  issuer?: string | null;

  @IsOptional() @IsInt() @Min(1980) @Max(2100)
  issuedYear?: number | null;
}