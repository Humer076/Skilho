import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CareerService } from './career.service';
import { CareerEntryDto } from './dto/career-entry.dto';
import { CertificateDto } from './dto/certificate.dto';
import { EducationDto } from './dto/education.dto';

@Controller('employee/career')
@UseGuards(JwtAuthGuard)
export class CareerController {
  constructor(private career: CareerService) {}

  private ensureEmployee(req: any) {
    if (req.user.role !== 'EMPLOYEE') {
      throw new ForbiddenException('Employees only');
    }
  }

  @Get()
  getAll(@Req() req: any) {
    this.ensureEmployee(req);
    return this.career.getAll(req.user.sub);
  }

  @Post('entries')
  createEntry(@Req() req: any, @Body() dto: CareerEntryDto) {
    this.ensureEmployee(req);
    return this.career.createEntry(req.user.sub, dto);
  }

  @Put('entries/:id')
  updateEntry(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: CareerEntryDto,
  ) {
    this.ensureEmployee(req);
    return this.career.updateEntry(req.user.sub, id, dto);
  }

  @Delete('entries/:id')
  removeEntry(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployee(req);
    return this.career.removeEntry(req.user.sub, id);
  }

  @Post('education')
  addEducation(@Req() req: any, @Body() dto: EducationDto) {
    this.ensureEmployee(req);
    return this.career.addEducation(req.user.sub, dto);
  }

  @Delete('education/:id')
  removeEducation(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployee(req);
    return this.career.removeEducation(req.user.sub, id);
  }

  @Post('certificates')
  addCertificate(@Req() req: any, @Body() dto: CertificateDto) {
    this.ensureEmployee(req);
    return this.career.addCertificate(req.user.sub, dto);
  }

  @Delete('certificates/:id')
  removeCertificate(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployee(req);
    return this.career.removeCertificate(req.user.sub, id);
  }
}