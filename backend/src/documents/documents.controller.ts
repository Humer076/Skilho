import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

@Controller('employer/documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private documents: DocumentsService) {}

  private ensureEmployer(req: any) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Employers only');
    }
  }

  @Post()
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE, files: 1 } }),
  )
  upload(
    @Req() req: any,
    @Body('type') type: string,
    @UploadedFile()
    file: { originalname: string; buffer: Buffer; size: number },
  ) {
    this.ensureEmployer(req);
    return this.documents.upload(req.user.sub, type, file);
  }

  @Get()
  list(@Req() req: any) {
    this.ensureEmployer(req);
    return this.documents.list(req.user.sub);
  }

  @Get(':id/download')
  async download(
    @Req() req: any,
    @Param('id') id: string,
    @Res({ passthrough: true }) res: any,
  ) {
    this.ensureEmployer(req);
    const { doc, filePath } = await this.documents.getFile(req.user.sub, id);
    res.set({
      'Content-Type': doc.mimeType,
      'Content-Disposition': `inline; filename="${encodeURIComponent(doc.originalName)}"`,
      'X-Content-Type-Options': 'nosniff',
    });
    return new StreamableFile(createReadStream(filePath));
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployer(req);
    return this.documents.remove(req.user.sub, id);
  }
}