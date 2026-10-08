import { ExperienceLevel, JoiningPreference, WorkType } from '@prisma/client';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const JOB_SPECIALIZATIONS = [
  'Android',
  'iPhone',
  'Android & iPhone',
  'Laptop Hardware',
  'Laptop Software',
  'Chip-Level Repair',
  'Motherboard Repair',
  'IC-Level Repair',
  'Microsoldering',
  'BIOS Programming',
  'MacBook Repair',
  'Other skills',
];

export class JobDto {
  @IsString() @MinLength(3) @MaxLength(120)
  title: string;

  @IsString() @MinLength(10) @MaxLength(5000)
  description: string;

  @IsString() @MinLength(2) @MaxLength(80)
  category: string;

  @IsInt() @Min(1) @Max(500)
  vacancies: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(12)
  @ArrayUnique()
  @IsIn(JOB_SPECIALIZATIONS, { each: true })
  specializations: string[];

  @IsEnum(ExperienceLevel)
  experience: ExperienceLevel;

  @IsOptional() @IsInt() @Min(0) @Max(10000000)
  salaryMin?: number | null;

  @IsOptional() @IsInt() @Min(0) @Max(10000000)
  salaryMax?: number | null;

  @IsBoolean()
  salaryNegotiable: boolean;

  @IsString() @MinLength(2) @MaxLength(80)
  city: string;

  @IsString() @MinLength(2) @MaxLength(80)
  state: string;

  @IsEnum(WorkType)
  workType: WorkType;

  @IsEnum(JoiningPreference)
  joiningPreference: JoiningPreference;

  @IsOptional() @IsString() @MaxLength(200)
  workingHours?: string | null;

  @IsOptional() @IsString() @MaxLength(200)
  weeklyHolidays?: string | null;

  @IsBoolean()
  accommodationProvided: boolean;

  @IsBoolean()
  foodProvided: boolean;

  @IsBoolean()
  travelAllowance: boolean;

  @IsBoolean()
  overtimeAvailable: boolean;

  @IsOptional() @IsString() @MaxLength(500)
  requiredCertificates?: string | null;

  @IsOptional() @IsString() @MaxLength(1000)
  interviewProcess?: string | null;
}