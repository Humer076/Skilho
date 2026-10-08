import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmployerController } from './employer.controller';
import { EmployerService } from './employer.service';

@Module({
  imports: [AuthModule],
  controllers: [EmployerController],
  providers: [EmployerService],
})
export class EmployerModule {}