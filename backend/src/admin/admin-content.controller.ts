import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { IsArray, IsBoolean, IsEmail, IsIn, IsISO8601, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import { AdminContentService } from './admin-content.service';

class CreateAdminDto {
  @IsEmail() email: string;
  @IsString() @MinLength(8) @MaxLength(100) password: string;
  @IsOptional() @IsString() @MaxLength(100) displayName?: string;
  @IsString() @IsIn(['SUPER_ADMIN', 'VERIFICATION', 'PAYMENTS', 'CONTENT']) adminAccess: string;
}

class UpdateAdminDto {
  @IsOptional() @IsString() @IsIn(['ACTIVE', 'SUSPENDED', 'DEACTIVATED']) adminStatus?: string;
  @IsOptional() @IsString() @IsIn(['SUPER_ADMIN', 'VERIFICATION', 'PAYMENTS', 'CONTENT']) adminAccess?: string;
}

class ArticleDto {
  @IsString() @MaxLength(200) title: string;
  @IsOptional() @IsString() @MaxLength(220) slug?: string;
  @IsOptional() @IsString() @MaxLength(500) excerpt?: string;
  @IsString() content: string;
  @IsOptional() @IsString() featuredImage?: string;
  @IsOptional() @IsString() @MaxLength(80) category?: string;
  @IsOptional() @IsArray() tags?: string[];
  @IsOptional() @IsBoolean() isFeatured?: boolean;
  @IsOptional() @IsString() @IsIn(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']) status?: string;
  @IsOptional() @IsISO8601() scheduledAt?: string | null;
  @IsOptional() @IsString() seoTitle?: string;
  @IsOptional() @IsString() metaDescription?: string;
  @IsOptional() @IsArray() seoKeywords?: string[];
  @IsOptional() @IsString() canonicalUrl?: string;
  @IsOptional() @IsString() ogTitle?: string;
  @IsOptional() @IsString() ogDescription?: string;
  @IsOptional() @IsString() ogImage?: string;
}

class NotificationDto {
  @IsString() @MaxLength(200) title: string;
  @IsString() @MaxLength(2000) body: string;
  @IsString() @IsIn(['SYSTEM', 'JOB', 'APPLICATION', 'VERIFICATION', 'MESSAGE']) type: string;
  @IsOptional() @IsString() @IsIn(['ALL', 'EMPLOYERS', 'TECHNICIANS']) audience?: string;
  @IsOptional() @IsString() userId?: string;
}

@Controller('admin/manage')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminContentController {
  constructor(private content: AdminContentService) {}

  @Get('admin-users')
  adminUsers(@Query('q') q?: string, @Query('status') status?: string, @Query('page') page?: string) {
    return this.content.adminUsers(q, status, page);
  }

  @Post('admin-users')
  createAdmin(@Req() req: any, @Body() dto: CreateAdminDto) {
    return this.content.createAdminUser(req.user.sub, dto);
  }

  @Patch('admin-users/:id')
  updateAdmin(@Req() req: any, @Param('id') id: string, @Body() dto: UpdateAdminDto) {
    return this.content.updateAdminUser(req.user.sub, id, dto);
  }

  @Get('audit-logs')
  auditLogs(@Query('action') action?: string, @Query('entityType') entityType?: string, @Query('q') q?: string, @Query('page') page?: string) {
    return this.content.listAuditLogs({ action, entityType, q, page });
  }

  @Get('articles')
  articles(@Query() query: any) {
    return this.content.articles(query);
  }

  @Post('articles')
  createArticle(@Req() req: any, @Body() dto: ArticleDto) {
    return this.content.saveArticle(req.user.sub, dto);
  }

  @Patch('articles/:id')
  updateArticle(@Req() req: any, @Param('id') id: string, @Body() dto: ArticleDto) {
    return this.content.saveArticle(req.user.sub, dto, id);
  }

  @Post('articles/:id/publish')
  publishArticle(@Req() req: any, @Param('id') id: string) {
    return this.content.updateArticleStatus(req.user.sub, id, true);
  }

  @Post('articles/:id/unpublish')
  unpublishArticle(@Req() req: any, @Param('id') id: string) {
    return this.content.updateArticleStatus(req.user.sub, id, false);
  }

  @Delete('articles/:id')
  deleteArticle(@Req() req: any, @Param('id') id: string) {
    return this.content.deleteArticle(req.user.sub, id);
  }

  @Get('articles/categories')
  articleCategories() {
    return this.content.articleCategories();
  }

  @Post('notifications/broadcast')
  broadcast(@Req() req: any, @Body() dto: NotificationDto) {
    return this.content.notify(req.user.sub, dto);
  }

  @Post('notifications/user')
  notifyUser(@Req() req: any, @Body() dto: NotificationDto) {
    if (!dto.userId) throw new BadRequestException('A target user id is required.');
    return this.content.notify(req.user.sub, { ...dto, userId: dto.userId });
  }
}
