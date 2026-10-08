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
import { IsIn } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JobDto } from './dto/job.dto';
import { JobsService } from './jobs.service';

class JobStatusDto {
  @IsIn(['ACTIVE', 'CLOSED'])
  status: 'ACTIVE' | 'CLOSED';
}

@Controller('employer/jobs')
@UseGuards(JwtAuthGuard)
export class JobsController {
  constructor(private jobs: JobsService) {}

  private ensureEmployer(req: any) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Employers only');
    }
  }

  @Post()
  create(@Req() req: any, @Body() dto: JobDto) {
    this.ensureEmployer(req);
    return this.jobs.create(req.user.sub, dto);
  }

  @Get()
  list(@Req() req: any) {
    this.ensureEmployer(req);
    return this.jobs.list(req.user.sub);
  }

  // must stay above ':id' so "summary" is not treated as a job id
  @Get('summary')
  summary(@Req() req: any) {
    this.ensureEmployer(req);
    return this.jobs.summary(req.user.sub);
  }

  @Get(':id')
  getOne(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployer(req);
    return this.jobs.getOne(req.user.sub, id);
  }

  @Put(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() dto: JobDto) {
    this.ensureEmployer(req);
    return this.jobs.update(req.user.sub, id, dto);
  }

  @Post(':id/status')
  setStatus(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: JobStatusDto,
  ) {
    this.ensureEmployer(req);
    return this.jobs.setStatus(req.user.sub, id, dto.status);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployer(req);
    return this.jobs.remove(req.user.sub, id);
  }
}