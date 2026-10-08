import { Controller, Get, Param, Query } from '@nestjs/common';
import { PublicJobsService } from './public-jobs.service';

function str(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

// No login needed: this is the public job board
@Controller('jobs')
export class PublicJobsController {
  constructor(private jobs: PublicJobsService) {}

  @Get()
  search(@Query() query: Record<string, unknown>) {
    return this.jobs.search({
      q: str(query.q),
      category: str(query.category),
      specialization: str(query.specialization),
      experience: str(query.experience),
      joining: str(query.joining),
      workType: str(query.workType),
      location: str(query.location),
      minSalary: str(query.minSalary),
      page: str(query.page),
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.jobs.getOne(id);
  }
}
