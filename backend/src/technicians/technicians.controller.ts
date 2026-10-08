import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TechniciansService } from './technicians.service';

@Controller('employer/technicians')
@UseGuards(JwtAuthGuard)
export class TechniciansController {
  constructor(private technicians: TechniciansService) {}

  private ensureEmployer(req: any) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Employers only');
    }
  }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployer(req);
    return this.technicians.getEmployerView(req.user.sub, id);
  }

  @Get(':id/photo')
  async photo(
    @Req() req: any,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: any,
  ) {
    this.ensureEmployer(req);
    const { filePath, mimeType } = await this.technicians.getEmployerViewPhoto(
      req.user.sub,
      id,
    );
    res.set({
      'Content-Type': mimeType,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });
    return new StreamableFile(createReadStream(filePath));
  }
}

@Controller('employee/preview')
@UseGuards(JwtAuthGuard)
export class PreviewController {
  constructor(private technicians: TechniciansService) {}

  @Get()
  preview(@Req() req: any) {
    if (req.user.role !== 'EMPLOYEE') {
      throw new ForbiddenException('Employees only');
    }
    return this.technicians.getOwnPreview(req.user.sub);
  }
}