import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TechnicianSearchController } from './technician-search.controller';
import { TechnicianSearchService } from './technician-search.service';
import {
  PreviewController,
  TechniciansController,
} from './technicians.controller';
import { TechniciansService } from './technicians.service';

@Module({
  imports: [AuthModule],
  controllers: [
    TechniciansController,
    PreviewController,
    TechnicianSearchController,
  ],
  providers: [TechniciansService, TechnicianSearchService],
})
export class TechniciansModule {}