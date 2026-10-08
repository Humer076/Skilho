import { SkillLevel } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class SkillItemDto {
  @IsUUID()
  skillId: string;

  @IsEnum(SkillLevel)
  level: SkillLevel;
}

export class SaveSkillsDto {
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => SkillItemDto)
  skills: SkillItemDto[];
}