import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DbService } from 'src/db/db.service';
import { GeminiService } from 'src/gemini/gemini.service';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatContext {
  subjectId?: number;
  fileIds?: number[];
  mode?: 'STANDARD' | 'SOCRATIC' | 'CITATION_VERIFICATION';
}

export interface ConversationSummary {
  id: number;
  title: string;
  updatedAt: Date;
  messageCount: number;
}

const SYSTEM_PROMPT = `You are an expert AI Study Assistant specializing in Accounting and Law, with deep knowledge of Philippine laws and regulations.

Your areas of expertise include:
- **Accounting**: Financial accounting, managerial accounting, auditing, taxation, cost accounting, government accounting, accounting standards (PFRS, PAS)
- **Philippine Tax Law**: National Internal Revenue Code (NIRC), BIR regulations, income tax, VAT, documentary stamp tax, withholding tax
- **Philippine Business Law**: Corporation Code, Securities Regulation Code, negotiable instruments, insurance, transportation
- **Philippine Civil Law**: Obligations and contracts, property, succession, family code
- **Philippine Criminal Law**: Revised Penal Code, special penal laws
- **Philippine Labor Law**: Labor Code, DOLE regulations, employee-employer relations
- **Philippine Constitutional Law**: 1987 Constitution, bill of rights, government structure

## MANDATORY CITATION REQUIREMENTS (SMART CITATION)

You MUST cite specific legal sources in EVERY response that involves law or regulations. Format citations properly:

**For Philippine Laws:**
- Republic Acts: "R.A. No. 10963 (TRAIN Law), Section 24(A)(2)(a)"
- Civil Code: "Article 1156, Civil Code of the Philippines"
- Revised Penal Code: "Article 315, Revised Penal Code (Estafa)"
- Special Laws: "Section 3(e), R.A. No. 3019 (Anti-Graft Law)"

**For Jurisprudence:**
- Format: "Case Name, G.R. No. XXXXX, Date" (e.g., "People v. Sandiganbayan, G.R. No. 160619, April 12, 2005")
- Include the doctrine/ruling established

**For Accounting Standards:**
- PAS/PFRS: "PAS 16, paragraph 6" or "PFRS 15, paragraphs 31-34"
- Include relevant disclosure requirements

**For Tax Regulations:**
- BIR Issuances: "Revenue Regulations No. 2-98, as amended"
- Revenue Memorandum Circulars: "RMC No. 105-2020"

## Response Guidelines:
1. **ALWAYS include citations** - Every legal/accounting claim must reference a specific source
2. Use clear, educational language appropriate for students
3. Provide practical examples when explaining complex concepts
4. Format responses with proper structure: use headers, bullet points, and numbered lists
5. For computational problems, show step-by-step solutions
6. When uncertain, acknowledge limitations and suggest consulting official sources
7. For exam preparation, provide mnemonics or memory techniques when helpful
8. Include a "📚 References" section at the end listing all cited sources

Remember: You are helping students prepare for the CPA Board Exam and Bar Exam. Every answer must be authoritative and verifiable through proper citations.`;

const SOCRATIC_PROMPT = `
MODE: SOCRATIC TUTOR

You are now in Socratic Mode. Your goal is NOT to provide answers directly, but to guide the student to the answer through questioning.

RULES FOR SOCRATIC MODE:
1. **Never give the direct answer** unless the student has successfully arrived at it themselves.
2. **Ask guiding questions.** Break down complex problems into smaller, manageable steps.
3. **Challenge assumptions.** If the student makes a mistake, ask a question that exposes the flaw in their reasoning.
4. **Encourage citation.** Ask the student, "What specific article covers this?" or "Which accounting standard applies here?"
5. **Be patient.** If the student is stuck, provide a small hint, then ask another question.
6. **Verify understanding.** Once the student gets the right answer, ask them to explain *why* it is correct to ensure deep understanding.

Example Interaction:
Student: "Is a corporation liable for the acts of its directors?"
You: "That depends. Under the Doctrine of Separate Juridical Personality, how is a corporation viewed in relation to its stakeholders?"
Student: "It's a separate person."
You: "Correct. Since it's a separate person, does it generally share liability? And are there exceptions to this rule?"
`;

const CITATION_VERIFICATION_PROMPT = `
MODE: CITATION VERIFICATION

You are now in Citation Verification Mode. The student must CITE the specific legal provision, article, or standard BEFORE you confirm their answer.

RULES FOR CITATION VERIFICATION MODE:
1. **Require citations FIRST.** When a student makes a legal or accounting claim, ask them to cite the specific source.
2. **Do not confirm correctness** until they provide the proper citation.
3. **Format requirements:** 
   - For laws: "Article/Section ___, [Law Name]"
   - For cases: "[Case Name], G.R. No. ___, [Date]"
   - For standards: "[PAS/PFRS Number], paragraph ___"
4. **Provide feedback on citations:**
   - If correct: Confirm and elaborate on the provision
   - If incorrect: Guide them to the right source without giving it directly
   - If incomplete: Ask for more specificity
5. **Track progress.** Acknowledge when the student consistently cites correctly.

Example Interaction:
Student: "The prescriptive period for filing a criminal complaint for estafa is 20 years."
You: "You're making a claim about prescription periods. Can you cite the specific article that governs prescription of crimes?"
Student: "Article 90 of the Revised Penal Code."
You: "Correct! Article 90, RPC governs prescription of crimes. Now, estafa under Article 315 is punishable by varying penalties. Which specific paragraph of Article 90 applies to the penalty range for this estafa case?"
`;

@Injectable()
export class AiChatService {
  constructor(
    private readonly dbService: DbService,
    private readonly geminiService: GeminiService,
  ) {}

  /**
   * Get context from user's files for RAG
   */
  private async getFileContext(
    userId: string,
    fileIds?: number[],
  ): Promise<string> {
    if (!fileIds || fileIds.length === 0) return '';

    const files = await this.dbService.file.findMany({
      where: {
        id: { in: fileIds },
        userId,
      },
      select: {
        name: true,
        contentText: true,
      },
    });

    if (files.length === 0) return '';

    const context = files
      .filter((f) => f.contentText)
      .map((f) => `[From file: ${f.name}]\n${f.contentText}`)
      .join('\n\n---\n\n');

    return context
      ? `\n\nRelevant content from user's study materials:\n${context}\n\n`
      : '';
  }

  /**
   * Get subject context
   */
  private async getSubjectContext(
    userId: string,
    subjectId?: number,
  ): Promise<string> {
    if (!subjectId) return '';

    const subject = await this.dbService.subject.findFirst({
      where: { id: subjectId, userId },
      select: { title: true, description: true },
    });

    if (!subject) return '';

    return `\nCurrent subject context: ${subject.title}${subject.description ? ` - ${subject.description}` : ''}\n`;
  }

  /**
   * Send a chat message and get AI response
   */
  async chat(
    userId: string,
    message: string,
    conversationHistory: ChatMessage[] = [],
    context?: ChatContext,
  ): Promise<{ response: string; suggestedFollowUps: string[] }> {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    // Build context from files and subject
    const fileContext = await this.getFileContext(userId, context?.fileIds);
    const subjectContext = await this.getSubjectContext(
      userId,
      context?.subjectId,
    );

    // Build conversation for the AI
    const conversationParts = conversationHistory
      .slice(-10) // Keep last 10 messages for context
      .map(
        (msg) =>
          `${msg.role === 'user' ? 'Student' : 'Assistant'}: ${msg.content}`,
      )
      .join('\n\n');

    let effectiveSystemPrompt = SYSTEM_PROMPT;
    if (context?.mode === 'SOCRATIC') {
      effectiveSystemPrompt += SOCRATIC_PROMPT;
    } else if (context?.mode === 'CITATION_VERIFICATION') {
      effectiveSystemPrompt += CITATION_VERIFICATION_PROMPT;
    }

    const fullPrompt = `${effectiveSystemPrompt}
${subjectContext}
${fileContext}
${conversationParts ? `\nPrevious conversation:\n${conversationParts}\n` : ''}
Student: ${message}

Please provide a helpful, accurate, and educational response. If the question relates to Philippine law, cite specific laws and articles. If it relates to accounting, reference relevant standards.`;

    try {
      const response = await this.geminiService.generateContent(fullPrompt);

      // Generate suggested follow-up questions
      const followUpPrompt = `Based on this conversation about "${message}", suggest 3 brief follow-up questions the student might want to ask. Return only the questions, one per line, no numbering.`;

      let suggestedFollowUps: string[] = [];
      try {
        const followUps =
          await this.geminiService.generateContent(followUpPrompt);
        suggestedFollowUps = followUps
          .split('\n')
          .map((q) => q.trim())
          .filter((q) => q.length > 0)
          .slice(0, 3);
      } catch {
        // Ignore follow-up generation errors
      }

      return { response, suggestedFollowUps };
    } catch (error) {
      console.error('AI Chat error:', error);
      throw new BadRequestException(
        'Failed to generate response. Please try again.',
      );
    }
  }

  /**
   * Get quick explanations for concepts
   */
  async explainConcept(
    userId: string,
    concept: string,
    context?: ChatContext,
  ): Promise<string> {
    const subjectContext = await this.getSubjectContext(
      userId,
      context?.subjectId,
    );

    const prompt = `${SYSTEM_PROMPT}
${subjectContext}

Provide a clear, concise explanation of: "${concept}"

Structure your response as:
1. **Definition**: Brief definition
2. **Key Points**: Main aspects to understand
3. **Example**: A practical example
4. **Relevance**: Why this is important for students

Keep the explanation focused and exam-ready.`;

    return this.geminiService.generateContent(prompt);
  }

  /**
   * Generate practice questions from a topic
   */
  async generatePracticeQuestions(
    userId: string,
    topic: string,
    count: number = 5,
    context?: ChatContext,
  ): Promise<{ questions: Array<{ question: string; answer: string }> }> {
    const subjectContext = await this.getSubjectContext(
      userId,
      context?.subjectId,
    );

    const prompt = `${SYSTEM_PROMPT}
${subjectContext}

Generate ${count} practice questions about: "${topic}"

For each question, provide:
- The question (clear and exam-style)
- The correct answer with brief explanation

Format as JSON array:
[{"question": "...", "answer": "..."}]

Focus on concepts likely to appear in professional exams (CPA Board Exam, Bar Exam).`;

    const response = await this.geminiService.generateContent(prompt);

    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return { questions: JSON.parse(jsonMatch[0]) };
      }
    } catch {
      // If parsing fails, return empty
    }

    return { questions: [] };
  }

  /**
   * Summarize content from files
   */
  async summarizeContent(
    userId: string,
    fileIds: number[],
    style: 'brief' | 'detailed' | 'exam-focused' = 'exam-focused',
  ): Promise<string> {
    const fileContext = await this.getFileContext(userId, fileIds);

    if (!fileContext) {
      throw new BadRequestException('No content found in the selected files.');
    }

    const styleInstructions = {
      brief: 'Provide a brief summary highlighting the main points.',
      detailed:
        'Provide a comprehensive summary covering all important details.',
      'exam-focused':
        'Provide an exam-focused summary highlighting key concepts, formulas, and points likely to be tested.',
    };

    const prompt = `${SYSTEM_PROMPT}
${fileContext}

${styleInstructions[style]}

Structure the summary with clear headings and bullet points for easy review.`;

    return this.geminiService.generateContent(prompt);
  }

  // ============================================
  // Conversation History Management
  // ============================================

  /**
   * Get all conversations for a user
   */
  async getConversations(userId: string): Promise<ConversationSummary[]> {
    const conversations = await this.dbService.chatConversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { messages: true } },
      },
    });

    return conversations.map((conv) => ({
      id: conv.id,
      title: conv.title,
      updatedAt: conv.updatedAt,
      messageCount: conv._count.messages,
    }));
  }

  /**
   * Get a single conversation with messages
   */
  async getConversation(userId: string, conversationId: number) {
    const conversation = await this.dbService.chatConversation.findFirst({
      where: { id: conversationId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages.map((msg) => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content,
        timestamp: msg.createdAt,
      })),
    };
  }

  /**
   * Create a new conversation
   */
  async createConversation(userId: string, title?: string) {
    return this.dbService.chatConversation.create({
      data: {
        userId,
        title: title || 'New Conversation',
      },
    });
  }

  /**
   * Update conversation title
   */
  async updateConversationTitle(
    userId: string,
    conversationId: number,
    title: string,
  ) {
    const existing = await this.dbService.chatConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    return this.dbService.chatConversation.update({
      where: { id: conversationId },
      data: { title },
    });
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(userId: string, conversationId: number) {
    const existing = await this.dbService.chatConversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Conversation not found');
    }

    await this.dbService.chatConversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  }

  /**
   * Send a message to a conversation (with persistence)
   */
  async chatWithHistory(
    userId: string,
    conversationId: number | null,
    message: string,
    context?: ChatContext,
  ): Promise<{
    conversationId: number;
    response: string;
    suggestedFollowUps: string[];
  }> {
    if (!message || message.trim().length === 0) {
      throw new BadRequestException('Message cannot be empty');
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await this.dbService.chatConversation.findFirst({
        where: { id: conversationId, userId },
        include: {
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 20, // Last 20 messages for context
          },
        },
      });

      if (!conversation) {
        throw new NotFoundException('Conversation not found');
      }
    } else {
      // Create new conversation
      conversation = await this.dbService.chatConversation.create({
        data: {
          userId,
          title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        },
        include: { messages: true },
      });
    }

    // Save user message
    await this.dbService.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content: message,
      },
    });

    // Convert DB messages to chat format
    const conversationHistory: ChatMessage[] = (
      conversation.messages || []
    ).map((msg) => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content,
      timestamp: msg.createdAt,
    }));

    // Get AI response
    const { response, suggestedFollowUps } = await this.chat(
      userId,
      message,
      conversationHistory,
      context,
    );

    // Save assistant response
    await this.dbService.chatMessage.create({
      data: {
        conversationId: conversation.id,
        role: 'ASSISTANT',
        content: response,
      },
    });

    // Update conversation timestamp
    await this.dbService.chatConversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    return {
      conversationId: conversation.id,
      response,
      suggestedFollowUps,
    };
  }
}
