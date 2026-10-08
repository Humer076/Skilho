import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsBoolean, IsIn, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminExtraService } from './admin-extra.service';

class VerifyDto {
  @IsBoolean()
  verified: boolean;
}

class JobStatusDto {
  @IsIn(['ACTIVE', 'CLOSED'])
  status: string;
}

class SkillDto {
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;
}

class ActiveDto {
  @IsBoolean()
  active: boolean;
}

class PasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  newPassword: string;
}

@Controller('admin/manage')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminExtraController {
  constructor(private extra: AdminExtraService) {}

  @Get('users')
  users(@Query('q') q?: string, @Query('role') role?: string, @Query('page') page?: string) {
    return this.extra.users(q, role, page);
  }

  @Get('technicians')
  technicians(@Query('q') q?: string, @Query('page') page?: string) {
    return this.extra.technicians(q, page);
  }

  @Post('technicians/:id/verify')
  verify(@Param('id') id: string, @Body() dto: VerifyDto) {
    return this.extra.setTechnicianVerified(id, dto.verified);
  }

  @Get('employers')
  employers(@Query('q') q?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.extra.employers(q, status, page);
  }

  @Get('jobs')
  jobs(@Query('q') q?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.extra.jobs(q, status, page);
  }

  @Post('jobs/:id/status')
  jobStatus(@Param('id') id: string, @Body() dto: JobStatusDto) {
    return this.extra.setJobStatus(id, dto.status);
  }

  @Get('applications')
  applications(@Query('q') q?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.extra.applications(q, status, page);
  }

  @Get('skills')
  skills(@Query('q') q?: string, @Query('page') page?: string) {
    return this.extra.skills(q, page);
  }

  @Post('skills')
  addSkill(@Body() dto: SkillDto) {
    return this.extra.addSkill(dto.name);
  }

  @Post('skills/:id/active')
  skillActive(@Param('id') id: string, @Body() dto: ActiveDto) {
    return this.extra.setSkillActive(id, dto.active);
  }

  @Get('career')
  career(@Query('q') q?: string, @Query('page') page?: string) {
    return this.extra.career(q, page);
  }

  @Get('reports')
  reports() {
    return this.extra.reports();
  }

  @Get('me')
  me(@Req() req: any) {
    return this.extra.me(req.user.sub);
  }

  @Post('password')
  password(@Req() req: any, @Body() dto: PasswordDto) {
    return this.extra.changePassword(req.user.sub, dto.currentPassword, dto.newPassword);
  }
}