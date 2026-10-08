import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminExtraController } from './admin-extra.controller';
import { AdminExtraService } from './admin-extra.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminExtraController],
  providers: [AdminService, AdminExtraService, AdminGuard],
})
export class AdminModule {}