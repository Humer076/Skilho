import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { EmailService } from './email.service';

@Module({
  imports: [
    JwtModule.register({
      secret: 'skilho-dev-secret-change-before-launch',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, EmailService],
  exports: [JwtModule],
})
export class AuthModule {}
