import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CandidateEngagementService } from './candidate-engagement.service';

@Controller('candidate-engagement')
@UseGuards(JwtAuthGuard)
export class CandidateEngagementController {
  constructor(
    private readonly candidateService: CandidateEngagementService,
  ) {}

  private ensureRole(req: any, role: string) {
    if (req.user?.role !== role) {
      throw new ForbiddenException(
        'You do not have permission for this action',
      );
    }
  }

  // EMPLOYER: save a technician.
  @Post('saved/:employeeProfileId')
  saveCandidate(
    @Req() req: any,
    @Param('employeeProfileId') employeeProfileId: string,
  ) {
    this.ensureRole(req, 'EMPLOYER');

    return this.candidateService.saveCandidate(
      req.user.sub,
      employeeProfileId,
    );
  }

  // EMPLOYER: unsave a technician.
  @Delete('saved/:employeeProfileId')
  unsaveCandidate(
    @Req() req: any,
    @Param('employeeProfileId') employeeProfileId: string,
  ) {
    this.ensureRole(req, 'EMPLOYER');

    return this.candidateService.unsaveCandidate(
      req.user.sub,
      employeeProfileId,
    );
  }

  // EMPLOYER: list saved technicians.
  @Get('saved')
  getSavedCandidates(@Req() req: any) {
    this.ensureRole(req, 'EMPLOYER');

    return this.candidateService.getSavedCandidates(req.user.sub);
  }

  // EMPLOYER: tag a technician to one of their jobs.
  @Post('jobs/:jobId/tag/:employeeProfileId')
  tagCandidate(
    @Req() req: any,
    @Param('jobId') jobId: string,
    @Param('employeeProfileId') employeeProfileId: string,
    @Body('note') note?: string,
  ) {
    this.ensureRole(req, 'EMPLOYER');

    return this.candidateService.tagCandidate(
      req.user.sub,
      jobId,
      employeeProfileId,
      note,
    );
  }

  // EMPLOYEE: view jobs that employers tagged them for.
  @Get('technician/tagged-jobs')
  getTaggedJobsForTechnician(@Req() req: any) {
    this.ensureRole(req, 'EMPLOYEE');

    return this.candidateService.getTaggedJobsForTechnician(
      req.user.sub,
    );
  }

  // EMPLOYER: start or open a conversation with a technician.
  @Post('conversations/:employeeProfileId')
  startConversation(
    @Req() req: any,
    @Param('employeeProfileId') employeeProfileId: string,
  ) {
    this.ensureRole(req, 'EMPLOYER');

    return this.candidateService.startConversation(
      req.user.sub,
      employeeProfileId,
    );
  }

  // EMPLOYEE: start or open a conversation with an employer.
  @Post('conversations/for-employer/:employerProfileId')
  startConversationAsTechnician(
    @Req() req: any,
    @Param('employerProfileId') employerProfileId: string,
  ) {
    this.ensureRole(req, 'EMPLOYEE');

    return this.candidateService.startConversationAsTechnician(
      req.user.sub,
      employerProfileId,
    );
  }

  // EMPLOYER or EMPLOYEE: list their own conversations.
  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.candidateService.getConversations(
      req.user.sub,
      req.user.role,
    );
  }

  // EMPLOYER or EMPLOYEE: send a message.
  @Post('conversations/:conversationId/messages')
  sendMessage(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Body('content') content: string,
  ) {
    return this.candidateService.sendMessage(
      req.user.sub,
      req.user.role,
      conversationId,
      content,
    );
  }

  // EMPLOYER or EMPLOYEE: read messages in their own conversation.
  @Get('conversations/:conversationId/messages')
  getConversationMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
  ) {
    return this.candidateService.getConversationMessages(
      req.user.sub,
      req.user.role,
      conversationId,
    );
  }
}