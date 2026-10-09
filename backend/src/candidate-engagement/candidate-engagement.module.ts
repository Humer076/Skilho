import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CandidateEngagementController } from './candidate-engagement.controller';
import { CandidateEngagementService } from './candidate-engagement.service';

@Module({
  imports: [AuthModule],
  controllers: [CandidateEngagementController],
  providers: [CandidateEngagementService],
})
export class CandidateEngagementModule {}