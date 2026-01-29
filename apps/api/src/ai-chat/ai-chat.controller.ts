import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiChatService, ChatMessage, ChatContext } from './ai-chat.service';
import { GetUser } from 'src/auth/decorator/get-user.decorator';
import type { AuthenticatedUser } from 'src/auth/decorator/get-user.decorator';
import { IsEnum, IsOptional } from 'class-validator';

interface ChatDto {
  message: string;
  conversationHistory?: ChatMessage[];
  context?: ChatContext;
}

interface ChatWithHistoryDto {
  message: string;
  conversationId?: number | null;
  context?: ChatContext;
}

interface UpdateTitleDto {
  title: string;
}

interface ExplainDto {
  concept: string;
  context?: ChatContext;
}

interface PracticeQuestionsDto {
  topic: string;
  count?: number;
  context?: ChatContext;
}

interface SummarizeDto {
  fileIds: number[];
  style?: 'brief' | 'detailed' | 'exam-focused';
}

@Controller('ai-chat')
@UseGuards(AuthGuard('jwt'))
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  /**
   * Main chat endpoint
   */
  @Post('message')
  chat(@Body() dto: ChatDto, @GetUser() user: AuthenticatedUser) {
    return this.aiChatService.chat(
      user.userId,
      dto.message,
      dto.conversationHistory || [],
      dto.context,
    );
  }

  /**
   * Quick concept explanation
   */
  @Post('explain')
  async explainConcept(
    @Body() dto: ExplainDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const explanation = await this.aiChatService.explainConcept(
      user.userId,
      dto.concept,
      dto.context,
    );
    return { explanation };
  }

  /**
   * Generate practice questions
   */
  @Post('practice-questions')
  generatePracticeQuestions(
    @Body() dto: PracticeQuestionsDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.aiChatService.generatePracticeQuestions(
      user.userId,
      dto.topic,
      dto.count || 5,
      dto.context,
    );
  }

  /**
   * Summarize file content
   */
  @Post('summarize')
  async summarizeContent(
    @Body() dto: SummarizeDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    const summary = await this.aiChatService.summarizeContent(
      user.userId,
      dto.fileIds,
      dto.style || 'exam-focused',
    );
    return { summary };
  }

  // ============================================
  // Conversation History Endpoints
  // ============================================

  /**
   * Get all conversations
   */
  @Get('conversations')
  getConversations(@GetUser() user: AuthenticatedUser) {
    return this.aiChatService.getConversations(user.userId);
  }

  /**
   * Get a single conversation with messages
   */
  @Get('conversations/:id')
  getConversation(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.aiChatService.getConversation(user.userId, id);
  }

  /**
   * Create a new conversation
   */
  @Post('conversations')
  createConversation(@GetUser() user: AuthenticatedUser) {
    return this.aiChatService.createConversation(user.userId);
  }

  /**
   * Update conversation title
   */
  @Patch('conversations/:id')
  updateConversationTitle(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTitleDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.aiChatService.updateConversationTitle(
      user.userId,
      id,
      dto.title,
    );
  }

  /**
   * Delete a conversation
   */
  @Delete('conversations/:id')
  deleteConversation(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.aiChatService.deleteConversation(user.userId, id);
  }

  /**
   * Send message with persistent history
   */
  @Post('chat')
  chatWithHistory(
    @Body() dto: ChatWithHistoryDto,
    @GetUser() user: AuthenticatedUser,
  ) {
    return this.aiChatService.chatWithHistory(
      user.userId,
      dto.conversationId ?? null,
      dto.message,
      dto.context,
    );
  }
}
