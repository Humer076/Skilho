import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Delete,
  Req,
  UseGuards,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApplicationsService } from './applications.service';

class ApplyDto {
  @IsOptional() @IsString() @MaxLength(1000)
  coverNote?: string;
}

class StatusDto {
  @IsIn([
    'UNDER_REVIEW',
    'SHORTLISTED',
    'INTERVIEW_SCHEDULED',
    'SELECTED',
    'REJECTED',
    'HIRED',
  ])
  status: string;
}

@Controller()
@UseGuards(JwtAuthGuard)
export class ApplicationsController {
  constructor(private apps: ApplicationsService) {}

  private ensureEmployee(req: any) {
    if (req.user.role !== 'EMPLOYEE') throw new ForbiddenException('Employees only');
  }
  private ensureEmployer(req: any) {
    if (req.user.role !== 'EMPLOYER') throw new ForbiddenException('Employers only');
  }

  @Post('jobs/:id/apply')
  apply(@Req() req: any, @Param('id') id: string, @Body() dto: ApplyDto) {
    this.ensureEmployee(req);
    return this.apps.apply(req.user.sub, id, dto.coverNote);
  }

  @Post('jobs/:id/save')
  save(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployee(req);
    return this.apps.saveJob(req.user.sub, id);
  }

  @Delete('jobs/:id/save')
  unsave(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployee(req);
    return this.apps.unsaveJob(req.user.sub, id);
  }

  @Get('employee/applications')
  myApplications(@Req() req: any) {
    this.ensureEmployee(req);
    return this.apps.myApplications(req.user.sub);
  }

  @Post('employee/applications/:id/withdraw')
  withdraw(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployee(req);
    return this.apps.withdraw(req.user.sub, id);
  }

  @Get('employee/saved-jobs')
  savedJobs(@Req() req: any) {
    this.ensureEmployee(req);
    return this.apps.mySavedJobs(req.user.sub);
  }

  @Get('employer/applications/summary')
  employerSummary(@Req() req: any) {
    this.ensureEmployer(req);
    return this.apps.employerSummary(req.user.sub);
  }

  @Get('employer/jobs/:id/applications')
  listForJob(@Req() req: any, @Param('id') id: string) {
    this.ensureEmployer(req);
    return this.apps.listForJob(req.user.sub, id);
  }

  @Post('employer/applications/:id/status')
  changeStatus(@Req() req: any, @Param('id') id: string, @Body() dto: StatusDto) {
    this.ensureEmployer(req);
    return this.apps.changeStatus(req.user.sub, id, dto.status as any);
  }
}