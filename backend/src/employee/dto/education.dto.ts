import {
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class EducationDto {
  @IsString() @MinLength(2) @MaxLength(150)
  institution: string;

  @IsString() @MinLength(2) @MaxLength(150)
  qualification: string;

  @IsOptional() @IsString() @MaxLength(150)
  fieldOfStudy?: string | null;

  @IsOptional() @IsInt() @Min(1950) @Max(2100)
  startYear?: number | null;

  @IsOptional() @IsInt() @Min(1950) @Max(2100)
  endYear?: number | null;
}