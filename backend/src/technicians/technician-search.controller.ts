import {
  Controller,
  ForbiddenException,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { TechnicianSearchService } from './technician-search.service';

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

@Controller('employer/technician-search')
@UseGuards(JwtAuthGuard)
export class TechnicianSearchController {
  constructor(private search: TechnicianSearchService) {}

  private ensureEmployer(req: any) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Employers only');
    }
  }

  @Get('skills')
  skills(@Req() req: any) {
    this.ensureEmployer(req);
    return this.search.skillOptions(req.user.sub);
  }

  @Get()
  list(@Req() req: any, @Query() query: Record<string, unknown>) {
    this.ensureEmployer(req);
    return this.search.search(req.user.sub, {
      q: str(query.q),
      skill: str(query.skill),
      minYears: str(query.minYears),
      location: str(query.location),
      maxSalary: str(query.maxSalary),
      availability: str(query.availability),
      page: str(query.page),
    });
  }
}