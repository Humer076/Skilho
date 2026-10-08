import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const header: string | undefined = request.headers['authorization'];

    if (!header || !header.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing token');
    }

    try {
      const payload = await this.jwt.verifyAsync(header.slice(7));
      request.user = payload;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}