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
      You are an expert accounting professor from top Philippine universities like Jose Rizal University, creating a comprehensive and challenging practice exam. Your task is to generate ${itemCount} questions based ONLY on the provided context.

      EXAM CONTEXT:
      The user has described the exam as follows: "${description}". Use this description to focus the questions on the most relevant accounting topics within the context.

      SOURCE MATERIAL:
      ---
      ${context}
      ---

      QUESTION TYPE DISTRIBUTION:
      ${typeInstructions}

      CRITICAL REQUIREMENTS FOR ACCOUNTING EXAMS:
      1. All questions must be derived directly from the provided SOURCE MATERIAL. Do not use any external knowledge.
      2. Generate exactly ${itemCount} questions following the distribution above.
      3. Questions must be COMPREHENSIVE and CHALLENGING - suitable for top-tier Philippine universities like Jose Rizal University.
      4. Focus on:
         - Complex accounting principles and concepts
         - Application of accounting standards (PAS, PFRS)
         - Problem-solving scenarios requiring deep understanding
         - Critical analysis and interpretation of accounting data
         - Integration of multiple accounting concepts
      5. Make questions challenging enough to distinguish between students who truly understand accounting principles and those who only have surface-level knowledge.
      6. Include questions that test:
         - Higher-order thinking skills (analysis, synthesis, evaluation)
         - Real-world accounting scenarios
         - Ethical considerations in accounting
         - Technical proficiency in accounting procedures

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
        "text": "The question asking for identification (e.g., 'What accounting principle states that...?')",
        "type": "IDENTIFICATION",
        "options": [],
        "correctAnswer": "The exact answer expected (e.g., 'Matching Principle')"
      }

      IMPORTANT: Ensure questions are rigorous, comprehensive, and test deep understanding of accounting concepts suitable for top Philippine universities.
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
              `- ${count} IDENTIFICATION questions: Ask for specific accounting terms, principles, or concepts. Provide the exact expected answer.`,
            );
            break;
        }
      }
    });

    return instructions.join('\n');
  }

  /**
   * Evaluates if a user's answer is correct using AI for semantic comparison.
   * For single words or terminology, uses case-insensitive comparison.
   * For longer answers, uses AI to evaluate semantic equivalence.
   */
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
      const prompt = `You are an expert accounting professor evaluating exam answers. Determine if the student's answer is semantically equivalent to the correct answer.

QUESTION: ${questionText}

CORRECT ANSWER: ${normalizedCorrectAnswer}

STUDENT'S ANSWER: ${normalizedUserAnswer}

Evaluate if the student's answer demonstrates the same understanding and correctness as the correct answer. Consider:
- Semantic equivalence (same meaning, even if worded differently)
- Key concepts and terminology
- Accuracy of the information
- Minor spelling or grammatical differences should not affect correctness

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
}
