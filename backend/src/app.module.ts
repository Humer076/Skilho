import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { EmployerModule } from './employer/employer.module';
import { DocumentsModule } from './documents/documents.module';
import { AdminModule } from './admin/admin.module';
import { JobsModule } from './jobs/jobs.module';
import { PublicJobsModule } from './public-jobs/public-jobs.module';
import { EmployeeModule } from './employee/employee.module';
import { TechniciansModule } from './technicians/technicians.module';
import { ApplicationsModule } from './applications/applications.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PackagesModule } from './packages/packages.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    EmployerModule,
    DocumentsModule,
    AdminModule,
    JobsModule,
    PublicJobsModule,
    EmployeeModule,
    TechniciansModule,
    ApplicationsModule,
    NotificationsModule,
    PackagesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}