import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  Res,
  StreamableFile,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

class AdminLoginDto {
  @IsString()
  identifier: string;

  @IsString()
  password: string;
}

class ChangeStatusDto {
  @IsIn(['PENDING_VERIFICATION', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'SUSPENDED'])
  status: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}

class NoteDto {
  @IsString()
  @MinLength(1)
  @MaxLength(1000)
  note: string;
}

@Controller('admin')
export class AdminController {
  constructor(private admin: AdminService) {}

  @Post('login')
  login(@Body() dto: AdminLoginDto) {
    return this.admin.login(dto.identifier, dto.password);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, AdminGuard)
  dashboard(@Req() req: any) {
    return this.admin.getDashboard(req.adminAccess);
  }

  @Get('employers')
  @UseGuards(JwtAuthGuard, AdminGuard)
  list(@Query('status') status?: string) {
    return this.admin.listEmployers(status);
  }

  @Get('employers/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getOne(@Param('id') id: string) {
    return this.admin.getEmployer(id);
  }

  @Post('employers/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  changeStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ChangeStatusDto,
  ) {
    return this.admin.changeStatus(req.user.sub, id, dto.status, dto.note);
  }

  @Post('employers/:id/note')
  @UseGuards(JwtAuthGuard, AdminGuard)
  addNote(@Req() req: any, @Param('id') id: string, @Body() dto: NoteDto) {
    return this.admin.addNote(req.user.sub, id, dto.note);
  }

  @Post('employers/:id/request-documents')
  @UseGuards(JwtAuthGuard, AdminGuard)
  requestDocuments(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: NoteDto,
  ) {
    return this.admin.requestDocuments(req.user.sub, id, dto.note);
  }

  @Get('documents/:id/download')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async download(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: any,
  ) {
    const { doc, filePath } = await this.admin.getDocumentFile(id);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.originalName)}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(createReadStream(filePath));
  }
}
