import {
  IsArray,
  IsEmail,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateEmployerProfileDto {
  @IsOptional() @IsString() companyName?: string;
  @IsOptional() @IsString() legalName?: string;
  @IsOptional() @IsString() website?: string;
  @IsOptional() @IsEmail() companyEmail?: string;
  @IsOptional() @IsString() companyPhone?: string;
  @IsOptional() @IsString() companyType?: string;
  @IsOptional() @IsInt() @Min(1800) establishedYear?: number;
  @IsOptional() @IsString() registrationDetails?: string;
  @IsOptional() @IsString() gstNumber?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() state?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() pincode?: string;
  @IsOptional() @IsInt() @Min(0) employeeCount?: number;
  @IsOptional() @IsInt() @Min(0) technicianCount?: number;
  @IsOptional() @IsInt() @Min(0) branchCount?: number;
  @IsOptional() @IsArray() @IsString({ each: true }) specializations?: string[];
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() authorizedName?: string;
  @IsOptional() @IsString() authorizedDesignation?: string;
  @IsOptional() @IsString() authorizedMobile?: string;
  @IsOptional() @IsEmail() authorizedEmail?: string;
}