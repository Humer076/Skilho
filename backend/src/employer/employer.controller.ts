import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployerService } from './employer.service';
import { UpdateEmployerProfileDto } from './dto/update-employer-profile.dto';

@Controller('employer')
@UseGuards(JwtAuthGuard)
export class EmployerController {
  constructor(private employer: EmployerService) {}

  private ensureEmployer(req: any) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Employers only');
    }
  }

  @Get('profile')
  getProfile(@Req() req: any) {
    this.ensureEmployer(req);
    return this.employer.getProfile(req.user.sub);
  }

  @Put('profile')
  updateProfile(@Req() req: any, @Body() dto: UpdateEmployerProfileDto) {
    this.ensureEmployer(req);
    return this.employer.updateProfile(req.user.sub, dto);
  }

  @Get('verification')
  getVerification(@Req() req: any) {
    this.ensureEmployer(req);
    return this.employer.getVerification(req.user.sub);
  }

  @Post('resubmit')
  resubmit(@Req() req: any) {
    this.ensureEmployer(req);
    return this.employer.resubmit(req.user.sub);
  }
}