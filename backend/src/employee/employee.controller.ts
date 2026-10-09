
import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Post,
  Put,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsBoolean } from 'class-validator';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SaveSkillsDto } from './dto/save-skills.dto';
import { UpdateEmployeeProfileDto } from './dto/update-employee-profile.dto';
import { EmployeeService } from './employee.service';
import { PhotoService } from './photo.service';

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;

class PrivacyDto {
  @IsBoolean()
  visibleToEmployers: boolean;

  @IsBoolean()
  shareContactDetails: boolean;
}

@Controller('employee')
@UseGuards(JwtAuthGuard)
export class EmployeeController {
  constructor(
    private employee: EmployeeService,
    private photo: PhotoService,
  ) {}

  private ensureEmployee(req: any) {
    if (req.user.role !== 'EMPLOYEE') {
      throw new ForbiddenException('Employees only');
    }
  }

  @Get('profile')
  getProfile(@Req() req: any) {
    this.ensureEmployee(req);
    return this.employee.getProfile(req.user.sub);
  }

  @Put('profile')
  updateProfile(
    @Req() req: any,
    @Body() dto: UpdateEmployeeProfileDto,
  ) {
    this.ensureEmployee(req);
    return this.employee.updateProfile(req.user.sub, dto);
  }

  @Put('privacy')
  updatePrivacy(@Req() req: any, @Body() dto: PrivacyDto) {
    this.ensureEmployee(req);
    return this.employee.updatePrivacy(req.user.sub, dto);
  }

  @Get('skills')
  getSkills(@Req() req: any) {
    this.ensureEmployee(req);
    return this.employee.getSkills(req.user.sub);
  }

  @Put('skills')
  saveSkills(@Req() req: any, @Body() dto: SaveSkillsDto) {
    this.ensureEmployee(req);
    return this.employee.saveSkills(req.user.sub, dto);
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_PHOTO_SIZE, files: 1 },
    }),
  )
  uploadPhoto(
    @Req() req: any,
    @UploadedFile()
    file: { originalname: string; buffer: Buffer; size: number },
  ) {
    this.ensureEmployee(req);
    return this.photo.upload(req.user.sub, file);
  }

  @Get('photo')
  async getPhoto(@Req() req: any, @Res({ passthrough: true }) res: any) {
    this.ensureEmployee(req);

    const { filePath, mimeType } = await this.photo.getOwn(req.user.sub);

    res.set({
      'Content-Type': mimeType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });

    return new StreamableFile(createReadStream(filePath));
  }

  @Delete('photo')
  removePhoto(@Req() req: any) {
    this.ensureEmployee(req);
    return this.photo.remove(req.user.sub);
  }

  // Delete only the account belonging to the authenticated technician.
  @Delete('account')
  async deleteAccount(@Req() req: any) {
    this.ensureEmployee(req);
    return this.employee.deleteAccount(req.user.sub);
  }
}
