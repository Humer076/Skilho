import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

// Runs after JwtAuthGuard. It checks the ADMIN role in the database,
// not just in the token, so a removed admin loses access immediately.
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const userId: string | undefined = request.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Admins only');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, adminStatus: true, adminAccess: true },
    });
    if (!user || user.role !== 'ADMIN' || user.adminStatus !== 'ACTIVE') {
      throw new ForbiddenException('Admins only');
    }

    const access = user.adminAccess;
    if (!['SUPER_ADMIN', 'VERIFICATION', 'PAYMENTS', 'CONTENT'].includes(access)) {
      throw new ForbiddenException('Admin access is not configured.');
    }
    request.adminAccess = access;

    const accessRoutes: Record<string, string[]> = {
      VERIFICATION: ['/admin/dashboard', '/admin/companies', '/admin/employers', '/admin/technicians', '/admin/manage/employers', '/admin/manage/technicians'],
      PAYMENTS: ['/admin/dashboard', '/admin/packages', '/admin/reports', '/admin/manage/reports', '/packages/admin'],
      CONTENT: ['/admin/dashboard', '/admin/website-content', '/admin/manage/articles'],
    };
    const path = request.path as string;
    if (access !== 'SUPER_ADMIN' && !(accessRoutes[access] || []).some((route) => path === route || path.startsWith(`${route}/`))) {
      throw new ForbiddenException('Your admin account does not have access to this section.');
    }

    return true;
  }
}
