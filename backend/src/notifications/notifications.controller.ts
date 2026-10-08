import { Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notifications: NotificationsService) {}

  @Get()
  list(@Req() req: any) {
    return this.notifications.list(req.user.sub);
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    return this.notifications.unreadCount(req.user.sub);
  }

  @Post(':id/read')
  markRead(@Req() req: any, @Param('id') id: string) {
    return this.notifications.markRead(req.user.sub, id);
  }

  @Post('read-all')
  markAllRead(@Req() req: any) {
    return this.notifications.markAllRead(req.user.sub);
  }
}