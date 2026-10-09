import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminController } from './admin.controller';
import { AdminExtraController } from './admin-extra.controller';
import { AdminExtraService } from './admin-extra.service';
import { AdminGuard } from './admin.guard';
import { AdminService } from './admin.service';
import { AdminContentController } from './admin-content.controller';
import { AdminContentService } from './admin-content.service';

@Module({
  imports: [AuthModule],
  controllers: [AdminController, AdminExtraController, AdminContentController],
  providers: [AdminService, AdminExtraService, AdminContentService, AdminGuard],
})
export class AdminModule {}
