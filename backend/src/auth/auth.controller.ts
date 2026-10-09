import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  EmployeeSignupOtpRequestDto,
  EmployeeSignupOtpVerifyDto,
} from './dto/employee-signup-otp.dto';


@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() req: any) {
    return this.auth.me(req.user.sub);
  }

  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.identifier);
  }

  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto.token, dto.newPassword);
  }
@Post('employee-signup/request-otp')
requestEmployeeSignupOtp(
  @Body() dto: EmployeeSignupOtpRequestDto,
) {
  return this.auth.requestEmployeeSignupOtp(dto);
}

@Post('employee-signup/verify-otp')
verifyEmployeeSignupOtp(
  @Body() dto: EmployeeSignupOtpVerifyDto,
) {
  return this.auth.verifyEmployeeSignupOtp(dto);
}
}