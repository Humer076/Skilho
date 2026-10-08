import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { EmployeeController } from './employee.controller';
import { EmployeeService } from './employee.service';
import { PhotoService } from './photo.service';

@Module({
  imports: [AuthModule],
  controllers: [EmployeeController, CareerController],
  providers: [EmployeeService, CareerService, PhotoService],
})
export class EmployeeModule {}