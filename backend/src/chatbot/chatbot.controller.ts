import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatbotService } from './chatbot.service';

@Controller('chatbot')
@UseGuards(JwtAuthGuard)
export class ChatbotController {
  constructor(private readonly chatbot: ChatbotService) {}

  @Post('answer')
  answer(
    @Req() req: { user: { sub?: string; role?: string } },
    @Body() body: { message?: string },
  ) {
    const userId = req.user?.sub;
    const role = req.user?.role;

    if (!userId || !role) {
      throw new UnauthorizedException('Invalid user token');
    }

    return this.chatbot.answer(
      userId,
      role,
      String(body?.message || ''),
    );
  }
}