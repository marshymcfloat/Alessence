import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { Question, QuestionTypeEnum } from '@repo/db';

interface RawQuestionJson {
  text: string;
  type: string;
  options?: string[];
  correctAnswer: string;
}

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  parts?: GeminiPart[];
}

interface GeminiCandidate {
  content?: GeminiContent;
}

interface GeminiResponseWrapper {
  text?: string;
}

type GeminiResult =
  | string
  | (GeminiResponseWrapper & {
      response?: { text?: string };
      candidates?: GeminiCandidate[];
    });

export type GeneratedQuestion = Omit<
  Question,
  'id' | 'examId' | 'createdAt' | 'updatedAt' | 'userAnswers'
>;

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenAI;

  constructor() {
    this.genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
  }

  async generateExamQuestions(
    context: string,
    description: string,
    itemCount: number,
    questionTypes: QuestionTypeEnum[],
  ): Promise<GeneratedQuestion[]> {
    const typeCounts = this.distributeQuestionTypes(itemCount, questionTypes);
    const typeInstructions = this.buildQuestionTypeInstructions(
      typeCounts,
      questionTypes,
    );

    const prompt = `
      You are an expert professor from top Philippine universities (like UP, Ateneo, La Salle, Jose Rizal University), specializing in BOTH Accountancy and Law. Your task is to create a comprehensive and challenging practice exam with ${itemCount} questions based ONLY on the provided context.

      EXAM CONTEXT:
      The user has described the exam as follows: "${description}". Use this description to focus the questions on the most relevant topics within the context.

      SOURCE MATERIAL:
      ---
      ${context}
      ---

      QUESTION TYPE DISTRIBUTION:
      ${typeInstructions}

      CRITICAL REQUIREMENTS:
      1. All questions must be derived directly from the provided SOURCE MATERIAL. Do not use any external knowledge.
      2. Generate exactly ${itemCount} questions following the distribution above.
      3. Questions must be COMPREHENSIVE and CHALLENGING - suitable for CPA Board Exams, Bar Exams, or top-tier Philippine university standards.
      4. Intelligently detect the subject matter from the content and focus accordingly:

         FOR ACCOUNTING/FINANCE CONTENT, focus on:
         - Complex accounting principles and concepts
         - Application of accounting standards (PAS, PFRS, GAAP)
         - Problem-solving scenarios requiring deep understanding
         - Critical analysis and interpretation of financial data
         - Auditing standards and procedures
         - Taxation principles and computations
         - Management accounting and cost analysis

         FOR LAW/LEGAL CONTENT, focus on:
         - Philippine laws and jurisprudence (Civil Code, Revised Penal Code, Corporation Code, Tax Code, Labor Code, etc.)
         - Constitutional law principles
         - Legal definitions and terminology
         - Application of legal provisions to case scenarios
         - Interpretation of statutes and their elements
         - Criminal law elements and penalties
         - Civil obligations and contracts
         - Remedial law procedures
         - Commercial law and business regulations

      5. Make questions challenging enough to distinguish students who truly understand the subject from those with surface-level knowledge.
      6. Include questions that test:
         - Higher-order thinking skills (analysis, synthesis, evaluation)
         - Real-world scenarios and case applications
         - Ethical considerations
         - Technical proficiency and practical application
         - Integration of multiple concepts

      RESPONSE FORMAT:
      Your response MUST be a valid JSON array of objects. Do not include any text before or after the JSON array (e.g., no "json\`\`\`"). Each object in the array must have the following structure based on question type:

      For MULTIPLE_CHOICE questions:
      {
        "text": "The challenging question text.",
        "type": "MULTIPLE_CHOICE",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "The correct option text."
      }

      For TRUE_FALSE questions:
      {
        "text": "The statement to evaluate.",
        "type": "TRUE_FALSE",
        "options": ["True", "False"],
        "correctAnswer": "True" or "False"
      }

      For IDENTIFICATION questions:
      {
        "text": "The question asking for identification (e.g., 'What principle/law states that...?')",
        "type": "IDENTIFICATION",
        "options": [],
        "correctAnswer": "The exact answer expected"
      }

      IMPORTANT: Ensure questions are rigorous, comprehensive, and suitable for Philippine professional board exams (CPA/Bar) or top university standards.
    `;

    try {
      const result = (await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })) as GeminiResult;

      let responseText: string | undefined;

      if (typeof result === 'string') {
        responseText = result;
      } else if (result && typeof result === 'object') {
        if ('text' in result && typeof result.text === 'string') {
          responseText = result.text;
        } else if (
          'response' in result &&
          result.response &&
          typeof result.response === 'object' &&
          'text' in result.response
        ) {
          responseText = result.response.text as string;
        } else if (
          'candidates' in result &&
          Array.isArray(result.candidates) &&
          result.candidates.length > 0
        ) {
          const candidate = result.candidates[0];
          if (
            candidate &&
            typeof candidate === 'object' &&
            'content' in candidate
          ) {
            const content = candidate.content;
            if (
              content &&
              'parts' in content &&
              Array.isArray(content.parts) &&
              content.parts.length > 0
            ) {
              const part = content.parts[0];
              if (part && 'text' in part && typeof part.text === 'string') {
                responseText = part.text;
              }
            }
          }
        }
      }

      if (!responseText) {
        this.logger.error(
          'Received an empty or unexpected response from Gemini. Response structure:',
          JSON.stringify(result, null, 2),
        );
        throw new Error(
          'Received an empty or unexpected response from Gemini.',
        );
      }

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedResponse = JSON.parse(cleanedText) as RawQuestionJson[];

      if (!Array.isArray(parsedResponse)) {
        throw new Error('Gemini response is not a JSON array.');
      }

      return parsedResponse.map((q) => {
        let questionType: QuestionTypeEnum = QuestionTypeEnum.MULTIPLE_CHOICE;
        if (q.type === 'TRUE_FALSE' || q.type === QuestionTypeEnum.TRUE_FALSE) {
          questionType = QuestionTypeEnum.TRUE_FALSE;
        } else if (
          q.type === 'IDENTIFICATION' ||
          q.type === QuestionTypeEnum.IDENTIFICATION
        ) {
          questionType = QuestionTypeEnum.IDENTIFICATION;
        }

        return {
          ...q,
          type: questionType,
        };
      }) as GeneratedQuestion[];
    } catch (error) {
      this.logger.error(
        `Error generating exam questions: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as { response?: { text: string } };
        this.logger.error('Original response text:', apiError.response?.text);
      }

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Failed to generate or parse exam questions from Gemini: ${String(error)}`,
      );
    }
  }

  async generateFlashcards(
    context: string,
    cardCount: number,
  ): Promise<Array<{ front: string; back: string }>> {
    const prompt = `
      You are an expert study assistant specializing in Accountancy and Law (especially Philippine laws). Your task is to generate ${cardCount} flashcards based ONLY on the provided context.

      SOURCE MATERIAL:
      ---
      ${context}
      ---

      CRITICAL REQUIREMENTS FOR FLASHCARDS:
      1. All flashcards must be derived directly from the provided SOURCE MATERIAL. Do not use any external knowledge.
      2. Generate exactly ${cardCount} flashcards.
      3. Intelligently detect the subject matter and create appropriate flashcards:

         FOR ACCOUNTING/FINANCE CONTENT:
         - Key accounting definitions and concepts
         - Important formulas and calculations
         - Accounting standards (PAS, PFRS, GAAP)
         - Auditing procedures and terminology
         - Tax computation rules

         FOR LAW/LEGAL CONTENT:
         - Legal definitions and terminology
         - Key provisions from Philippine laws (Civil Code, RPC, Tax Code, Corporation Code, Labor Code, etc.)
         - Elements of crimes or civil obligations
         - Important jurisprudence and case doctrines
         - Legal maxims and principles
         - Statutory requirements and procedures

      4. Each flashcard should be:
         - Simple and focused (one concept per card)
         - Clear and concise
         - Suitable for spaced repetition learning
         - Helpful for CPA/Bar exam preparation
      5. Front side (question) should be:
         - A clear question or prompt
         - Brief and direct
         - Examples: "What is X?", "Define Y", "Under Article ___, what are the elements of...?"
      6. Back side (answer) should be:
         - A clear, concise answer
         - Direct and factual
         - Complete enough to understand the concept
         - Include article numbers or references when relevant

      RESPONSE FORMAT:
      Your response MUST be a valid JSON array of objects. Do not include any text before or after the JSON array. Each object must have the following structure:

      {
        "front": "The question or prompt for the front of the card",
        "back": "The answer or explanation for the back of the card"
      }

      IMPORTANT: Ensure flashcards are clear, concise, and suitable for effective memorization and professional exam preparation.
    `;

    try {
      const result = (await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })) as GeminiResult;

      let responseText: string | undefined;

      if (typeof result === 'string') {
        responseText = result;
      } else if (result && typeof result === 'object') {
        if ('text' in result && typeof result.text === 'string') {
          responseText = result.text;
        } else if (
          'response' in result &&
          result.response &&
          typeof result.response === 'object' &&
          'text' in result.response
        ) {
          responseText = result.response.text as string;
        } else if (
          'candidates' in result &&
          Array.isArray(result.candidates) &&
          result.candidates.length > 0
        ) {
          const candidate = result.candidates[0];
          if (
            candidate &&
            typeof candidate === 'object' &&
            'content' in candidate
          ) {
            const content = candidate.content;
            if (
              content &&
              'parts' in content &&
              Array.isArray(content.parts) &&
              content.parts.length > 0
            ) {
              const part = content.parts[0];
              if (part && 'text' in part && typeof part.text === 'string') {
                responseText = part.text;
              }
            }
          }
        }
      }

      if (!responseText) {
        this.logger.error(
          'Received an empty or unexpected response from Gemini for flashcard generation.',
        );
        throw new Error(
          'Received an empty or unexpected response from Gemini.',
        );
      }

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(cleanedText) as Array<{ front: string; back: string }>;

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array of flashcards.');
      }

      if (parsed.length === 0) {
        throw new Error('No flashcards were generated.');
      }

      // Validate structure
      for (const card of parsed) {
        if (!card.front || !card.back) {
          throw new Error('Invalid flashcard structure: missing front or back.');
        }
      }

      return parsed;
    } catch (error) {
      this.logger.error('Error generating flashcards:', error);

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Failed to generate or parse flashcards from Gemini: ${String(error)}`,
      );
    }
  }

  private distributeQuestionTypes(
    totalCount: number,
    types: QuestionTypeEnum[],
  ): Map<QuestionTypeEnum, number> {
    const distribution = new Map<QuestionTypeEnum, number>();
    const baseCount = Math.floor(totalCount / types.length);
    const remainder = totalCount % types.length;

    types.forEach((type, index) => {
      distribution.set(type, baseCount + (index < remainder ? 1 : 0));
    });

    return distribution;
  }

  private buildQuestionTypeInstructions(
    typeCounts: Map<QuestionTypeEnum, number>,
    types: QuestionTypeEnum[],
  ): string {
    const instructions: string[] = [];

    types.forEach((type) => {
      const count = typeCounts.get(type) || 0;
      if (count > 0) {
        switch (type) {
          case QuestionTypeEnum.MULTIPLE_CHOICE:
            instructions.push(
              `- ${count} MULTIPLE_CHOICE questions: Each must have exactly 4 options (A, B, C, D). Make distractors plausible and challenging.`,
            );
            break;
          case QuestionTypeEnum.TRUE_FALSE:
            instructions.push(
              `- ${count} TRUE_FALSE questions: Present statements that require deep understanding to evaluate correctly. Avoid obvious statements.`,
            );
            break;
          case QuestionTypeEnum.IDENTIFICATION:
            instructions.push(
              `- ${count} IDENTIFICATION questions: Ask for specific terms, principles, legal provisions, or concepts. Provide the exact expected answer (e.g., accounting terms, article numbers, legal doctrines).`,
            );
            break;
        }
      }
    });

    return instructions.join('\n');
  }

  async evaluateAnswer(
    userAnswer: string,
    correctAnswer: string,
    questionText: string,
  ): Promise<boolean> {
    const normalizedUserAnswer = userAnswer.trim();
    const normalizedCorrectAnswer = correctAnswer.trim();

    if (!normalizedUserAnswer || !normalizedCorrectAnswer) {
      return false;
    }

    const userWords = normalizedUserAnswer.split(/\s+/).length;
    const correctWords = normalizedCorrectAnswer.split(/\s+/).length;
    const isShortAnswer = userWords <= 2 && correctWords <= 2;

    if (isShortAnswer) {
      return (
        normalizedUserAnswer.toLowerCase() ===
        normalizedCorrectAnswer.toLowerCase()
      );
    }

    try {
      const prompt = `You are an expert professor specializing in Accountancy and Philippine Law, evaluating exam answers. Determine if the student's answer is semantically equivalent to the correct answer.

QUESTION: ${questionText}

CORRECT ANSWER: ${normalizedCorrectAnswer}

STUDENT'S ANSWER: ${normalizedUserAnswer}

Evaluate if the student's answer demonstrates the same understanding and correctness as the correct answer. Consider:
- Semantic equivalence (same meaning, even if worded differently)
- Key concepts and terminology (accounting terms, legal provisions, article numbers)
- Accuracy of the information
- Minor spelling or grammatical differences should not affect correctness
- For legal answers: correct citation of laws/articles even if phrasing differs
- For accounting answers: correct principles even if explained differently

Respond with ONLY a JSON object in this exact format:
{
  "isCorrect": true or false,
  "reason": "Brief explanation of why the answer is correct or incorrect"
}

Do not include any text before or after the JSON object.`;

      const result = (await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })) as GeminiResult;

      let responseText: string | undefined;

      if (typeof result === 'string') {
        responseText = result;
      } else if (result && typeof result === 'object') {
        if ('text' in result && typeof result.text === 'string') {
          responseText = result.text;
        } else if (
          'response' in result &&
          result.response &&
          typeof result.response === 'object' &&
          'text' in result.response
        ) {
          responseText = result.response.text as string;
        } else if (
          'candidates' in result &&
          Array.isArray(result.candidates) &&
          result.candidates.length > 0
        ) {
          const candidate = result.candidates[0];
          if (
            candidate &&
            typeof candidate === 'object' &&
            'content' in candidate
          ) {
            const content = candidate.content;
            if (
              content &&
              'parts' in content &&
              Array.isArray(content.parts) &&
              content.parts.length > 0
            ) {
              const part = content.parts[0];
              if (part && 'text' in part && typeof part.text === 'string') {
                responseText = part.text;
              }
            }
          }
        }
      }

      if (!responseText) {
        this.logger.warn(
          'Failed to extract response from Gemini for answer evaluation. Falling back to case-insensitive comparison.',
        );
        return (
          normalizedUserAnswer.toLowerCase() ===
          normalizedCorrectAnswer.toLowerCase()
        );
      }

      let cleanedText = responseText.trim();
      if (cleanedText.startsWith('```json')) {
        cleanedText = cleanedText
          .replace(/^```json\s*/, '')
          .replace(/\s*```$/, '');
      } else if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsedResponse = JSON.parse(cleanedText) as {
        isCorrect: boolean;
        reason?: string;
      };

      if (typeof parsedResponse.isCorrect !== 'boolean') {
        this.logger.warn(
          'Invalid response format from Gemini for answer evaluation. Falling back to case-insensitive comparison.',
        );
        return (
          normalizedUserAnswer.toLowerCase() ===
          normalizedCorrectAnswer.toLowerCase()
        );
      }

      return parsedResponse.isCorrect;
    } catch (error) {
      this.logger.error(
        `Error evaluating answer with AI: ${error instanceof Error ? error.message : String(error)}. Falling back to case-insensitive comparison.`,
      );

      return (
        normalizedUserAnswer.toLowerCase() ===
        normalizedCorrectAnswer.toLowerCase()
      );
    }
  }

  async generateSummary(
    sourceText: string,
    description: string,
    template: string = 'COMPREHENSIVE',
  ): Promise<string> {
    const templateInstructions = this.getSummaryTemplateInstructions(template);

    const prompt = `
      Create focused study notes from the provided material.

      USER'S REQUEST:
      "${description}"

      SOURCE MATERIAL:
      ---
      ${sourceText}
      ---

      TEMPLATE TO FOLLOW:
      ${templateInstructions}

      WRITING STYLE:
      - Start directly with the first topic heading. No introductions, no preambles.
      - Do NOT begin with phrases like "This document provides...", "Let's break down...", "Alright...", or any opening commentary
      - Write in a clear, neutral tone - professional but readable
      - Use contractions naturally (it's, don't, can't) but don't be overly casual
      - Be concise and direct
      - Focus on explaining concepts clearly, not on being friendly or motivational
      - No cheerleading phrases like "make sure you get it!" or "this is super important!"

      WHAT TO AVOID:
      - Meta-commentary about the document ("this covers...", "the material discusses...")
      - Overly casual language ("Alright", "Okay so", "Here's the thing")
      - Motivational filler ("This is crucial!", "Pay attention to this!")
      - Generic AI introductions ("This comprehensive overview...")

      CONTENT FOCUS:
      Detect the subject and include:

      FOR ACCOUNTING/FINANCE:
      - Definitions and key concepts
      - Formulas and calculations
      - Standards references (PAS, PFRS, IAS, BIR rules)
      - Recognition and measurement criteria
      - Important distinctions and classifications

      FOR LAW/LEGAL:
      - Elements and requisites
      - Article/section references
      - Key definitions
      - Landmark cases and doctrines
      - Legal maxims with explanations

      STRUCTURE:
      - Clear headings and subheadings
      - Bullet points for lists
      - Numbered steps for processes
      - Short, scannable paragraphs
      - Bold for key terms

      RESPONSE FORMAT:
      Provide the summary directly. No markdown code blocks. No JSON.
      Begin immediately with the first heading - no introduction.
    `;

    try {
      const result = (await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })) as GeminiResult;

      let responseText: string | undefined;

      if (typeof result === 'string') {
        responseText = result;
      } else if (result && typeof result === 'object') {
        if ('text' in result && typeof result.text === 'string') {
          responseText = result.text;
        } else if (
          'response' in result &&
          result.response &&
          typeof result.response === 'object' &&
          'text' in result.response
        ) {
          responseText = result.response.text as string;
        } else if (
          'candidates' in result &&
          Array.isArray(result.candidates) &&
          result.candidates.length > 0
        ) {
          const candidate = result.candidates[0];
          if (
            candidate &&
            typeof candidate === 'object' &&
            'content' in candidate
          ) {
            const content = candidate.content;
            if (
              content &&
              'parts' in content &&
              Array.isArray(content.parts) &&
              content.parts.length > 0
            ) {
              const part = content.parts[0];
              if (part && 'text' in part && typeof part.text === 'string') {
                responseText = part.text;
              }
            }
          }
        }
      }

      if (!responseText) {
        this.logger.error(
          'Received an empty or unexpected response from Gemini for summary generation.',
        );
        throw new Error(
          'Received an empty or unexpected response from Gemini.',
        );
      }

      return responseText.trim();
    } catch (error) {
      this.logger.error(
        `Error generating summary: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Failed to generate summary from Gemini: ${String(error)}`,
      );
    }
  }

  /**
   * Generic method to generate content from a prompt
   */
  async generateContent(prompt: string): Promise<string> {
    try {
      const result = (await this.genAI.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      })) as GeminiResult;

      let responseText: string | undefined;

      if (typeof result === 'string') {
        responseText = result;
      } else if (result && typeof result === 'object') {
        if ('text' in result && typeof result.text === 'string') {
          responseText = result.text;
        } else if (
          'response' in result &&
          result.response &&
          typeof result.response === 'object' &&
          'text' in result.response
        ) {
          responseText = result.response.text as string;
        } else if (
          'candidates' in result &&
          Array.isArray(result.candidates) &&
          result.candidates.length > 0
        ) {
          const candidate = result.candidates[0];
          if (
            candidate &&
            typeof candidate === 'object' &&
            'content' in candidate
          ) {
            const content = candidate.content;
            if (
              content &&
              'parts' in content &&
              Array.isArray(content.parts) &&
              content.parts.length > 0
            ) {
              const part = content.parts[0];
              if (part && 'text' in part && typeof part.text === 'string') {
                responseText = part.text;
              }
            }
          }
        }
      }

      if (!responseText) {
        this.logger.error(
          'Received an empty or unexpected response from Gemini.',
        );
        throw new Error(
          'Received an empty or unexpected response from Gemini.',
        );
      }

      return responseText.trim();
    } catch (error) {
      this.logger.error(
        `Error generating content: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      if (error instanceof Error) {
        throw error;
      }

      throw new Error(
        `Failed to generate content from Gemini: ${String(error)}`,
      );
    }
  }

  private getSummaryTemplateInstructions(template: string): string {
    switch (template) {
      case 'KEY_POINTS':
        return `
          Format: Bullet-point list of key concepts, formulas, and important information.
          - Use clear, concise bullet points
          - Group related concepts together
          - Highlight formulas and calculations prominently
          - Include definitions for key terms
        `;
      case 'CHAPTER_SUMMARY':
        return `
          Format: Structured chapter-style summary with sections and subsections.
          - Use clear headings and subheadings
          - Organize by topics/themes
          - Include introduction, main content sections, and key takeaways
          - Use numbered or bulleted lists for clarity
        `;
      case 'CONCEPT_MAP':
        return `
          Format: Hierarchical or interconnected concept map style.
          - Show relationships between concepts
          - Use indentation or visual hierarchy
          - Connect related ideas
          - Show how concepts build upon each other
        `;
      case 'CUSTOM':
        return `
          Format: Custom format based on the document structure and user requirements.
          - Adapt to the document's natural organization
          - Follow the user's specific instructions in the description
          - Maintain logical flow and coherence
        `;
      case 'COMPREHENSIVE':
      default:
        return `
          Format: Comprehensive, detailed summary with full explanations.
          - Include all major concepts and details
          - Provide context and explanations
          - Use clear section headings
          - Include examples and practical applications
          - Maintain thorough coverage of the source material
        `;
    }
  }
}
