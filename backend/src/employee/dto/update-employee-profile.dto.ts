import { EmploymentStatus } from '@prisma/client';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateEmployeeProfileDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(100)
  fullName?: string | null;

  @IsOptional() @IsString() @MaxLength(100)
  professionalTitle?: string | null;

  @IsOptional() @IsString() @MaxLength(80)
  currentCity?: string | null;

  @IsOptional() @IsString() @MaxLength(80)
  currentState?: string | null;

  @IsOptional() @IsInt() @Min(0) @Max(720)
  totalExperienceMonths?: number | null;

  @IsOptional() @IsEnum(EmploymentStatus)
  employmentStatus?: EmploymentStatus | null;

  @IsOptional() @IsInt() @Min(0) @Max(10000000)
  expectedSalary?: number | null;

  @IsOptional() @IsString() @MaxLength(120)
  preferredLocation?: string | null;

  @IsOptional() @IsInt() @Min(0) @Max(180)
  noticePeriodDays?: number | null;

  @IsOptional() @IsBoolean()
  immediateJoining?: boolean;
}