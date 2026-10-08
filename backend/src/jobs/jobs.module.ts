import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PackagesModule } from '../packages/packages.module';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

@Module({
  imports: [AuthModule, PackagesModule],
  controllers: [JobsController],
  providers: [JobsService],
})
export class JobsModule {}