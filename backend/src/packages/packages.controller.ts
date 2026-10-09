import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../admin/admin.guard';
import { PackagesService } from './packages.service';

class CreatePackageDto {
  @IsString() @MinLength(2)
  name: string;

  @IsIn(['NORMAL', 'GOLD', 'CUSTOM'])
  tier: string;

  @IsInt() @Min(0)
  priceRupees: number;

  @IsInt() @Min(1)
  durationDays: number;

  @IsInt() @Min(0)
  jobCredits: number;

  @IsBoolean()
  featuredJobs: boolean;

  @IsBoolean()
  advancedSearch: boolean;

  @IsBoolean()
  priorityListing: boolean;
}

class UpdatePackageDto {
  @IsOptional() @IsString() @MinLength(2)
  name?: string;

  @IsOptional() @IsInt() @Min(0)
  priceRupees?: number;

  @IsOptional() @IsInt() @Min(1)
  durationDays?: number;

  @IsOptional() @IsInt() @Min(0)
  jobCredits?: number;

  @IsOptional() @IsBoolean()
  featuredJobs?: boolean;

  @IsOptional() @IsBoolean()
  advancedSearch?: boolean;

  @IsOptional() @IsBoolean()
  priorityListing?: boolean;

  @IsOptional() @IsBoolean()
  active?: boolean;
}

@Controller()
export class PackagesController {
  constructor(private packages: PackagesService) {}

  @Get('packages')
  listActive() {
    return this.packages.listActive();
  }

  @Get('employer/subscription')
  @UseGuards(JwtAuthGuard)
  mySubscription(@Req() req: any) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Employers only');
    }
    return this.packages.myActiveSubscription(req.user.sub);
  }
  // TEMPORARY test-mode endpoint, removed once real Razorpay payment is added.
  @Post('employer/packages/:id/test-activate')
  @UseGuards(JwtAuthGuard)
  async testActivate(@Req() req: any, @Param('id') id: string) {
    if (req.user.role !== 'EMPLOYER') {
      throw new ForbiddenException('Employers only');
    }
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Test package activation is disabled in production.');
    }
    const profile = await this.packages.findEmployerProfileId(req.user.sub);
    return this.packages.activateSubscription(profile, id);
  }
  @Get('admin/packages/purchases')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminPurchaseHistory() {
    return this.packages.adminPurchaseHistory();
  }

  @Get('admin/packages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminList() {
    return this.packages.adminList();
  }

  @Post('admin/packages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminCreate(@Body() dto: CreatePackageDto) {
    return this.packages.adminCreate(dto);
  }

  @Put('admin/packages/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  adminUpdate(@Param('id') id: string, @Body() dto: UpdatePackageDto) {
    return this.packages.adminUpdate(id, dto);
  }
}
