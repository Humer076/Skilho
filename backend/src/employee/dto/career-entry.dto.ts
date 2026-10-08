import { CareerEmploymentType, CareerStage } from '@prisma/client';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CareerEntryDto {
  @IsString() @MinLength(2) @MaxLength(120)
  organization: string;

  @IsString() @MinLength(2) @MaxLength(120)
  position: string;

  @IsEnum(CareerStage)
  stage: CareerStage;

  @IsEnum(CareerEmploymentType)
  employmentType: CareerEmploymentType;

  @IsDateString()
  startDate: string;

  @IsOptional() @IsDateString()
  endDate?: string | null;

  @IsOptional() @IsString() @MaxLength(120)
  location?: string | null;

  @IsArray()
  @ArrayMaxSize(15)
  @IsString({ each: true })
  @MaxLength(60, { each: true })
  skills: string[];

  @IsOptional() @IsString() @MaxLength(2000)
  responsibilities?: string | null;

  @IsOptional() @IsString() @MaxLength(200)
  certificateObtained?: string | null;

  @IsOptional() @IsString() @MaxLength(2000)
  description?: string | null;
}