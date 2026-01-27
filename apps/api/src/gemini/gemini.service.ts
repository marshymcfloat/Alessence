import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Question, QuestionTypeEnum } from '@repo/db';
import {
  PHILIPPINE_ACADEMIC_PERSONA,
  HALLUCINATION_GUARDRAIL,
  LOCAL_CONTEXT_INJECTOR,
} from '../common/prompt-constants';

interface RawQuestionJson {
  text: string;
  type: string;
  options?: string[];
  correctAnswer: string;
}

export type GeneratedQuestion = Omit<
  Question,
  'id' | 'examId' | 'createdAt' | 'updatedAt' | 'userAnswers'
>;

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private visionModel: any;
  private readonly logger = new Logger(GeminiService.name);

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables');
      throw new Error('GEMINI_API_KEY not found');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });
    this.visionModel = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
    });
  }

  /**
   * Centralized method to interact with the Gemini Model
   * Handles text generation and extraction
   */
  public async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('Received empty response from Gemini');
      }

      return text.trim();
    } catch (error) {
      this.logger.error(`Gemini generation failed: ${error}. Retrying...`);
      // Simple retry logic or rethrow could go here
      throw error;
    }
  }

  async generateExamQuestions(
    context: string,
    description: string,
    itemCount: number,
    types: QuestionTypeEnum[],
    weakTopics?: string[],
  ): Promise<any[]> {
    const weakTopicsInstruction =
      weakTopics && weakTopics.length > 0
        ? `PRIORITY TOPICS (Focus 40% of questions here): ${weakTopics.join(', ')}`
        : '';

    const typeCounts = this.distributeQuestionTypes(itemCount, types);
    const typeInstructions = this.buildQuestionTypeInstructions(
      typeCounts,
      types,
    );

    const prompt = `
      ${PHILIPPINE_ACADEMIC_PERSONA}

      Your task is to create a comprehensive and challenging practice exam with ${itemCount} questions based ONLY on the provided context.

      EXAM CONTEXT:
      The user has described the exam as follows: "${description}". Use this description to focus the questions on the most relevant topics within the context.

      ${weakTopicsInstruction}

      ${LOCAL_CONTEXT_INJECTOR}

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
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);

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
      );
      throw error;
    }
  }

  async generateFlashcards(
    context: string,
    cardCount: number,
  ): Promise<Array<{ front: string; back: string }>> {
    const prompt = `
      ${PHILIPPINE_ACADEMIC_PERSONA}

      Your task is to create ${cardCount} high-quality flashcards based on the provided content.

      SOURCE MATERIAL:
      ---
      ${context}
      ---

      ${HALLUCINATION_GUARDRAIL}

      RULES:
      1. **Focus**: Extract key concepts, definitions, enumerations, and distinctions suitable for board exam review.
      2. **Cross-Reference**: If the content touches on Accounting or Law, you may briefly cross-reference current Philippine professional standards (PFRS, PAS, TRAIN Law, Philippine Jurisprudence) where applicable to add value, BUT restrict yourself to the source material's primary topic.
      3. **Clarity**: Questions (front) should be precise. Answers (back) should be comprehensive but concise.

      INTELLIGENT CONTENT FILTER:
      - For ACCOUNTING: Focus on formulas, standard definitions (PAS/PFRS), and pro-forma entries.
      - For LAW: Focus on elements of crimes/contracts, requisites, prescriptive periods, and distinctions (e.g., Void vs Voidable).
      - For TAXATION: Focus on rates, exemptions, and deadlines (use BIR Tax Code / TRAIN / CREATE).

      RESPONSE FORMAT:
      Your response MUST be a valid JSON array of objects. Do not include any text before or after the JSON array.
      [
        {
          "front": "Question or Term",
          "back": "Answer or Definition"
        }
      ]
    `;

    try {
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);

      const parsed = JSON.parse(cleanedText) as Array<{
        front: string;
        back: string;
      }>;

      if (!Array.isArray(parsed)) {
        throw new Error('Response is not an array of flashcards.');
      }

      return parsed;
    } catch (error) {
      this.logger.error('Error generating flashcards:', error);
      throw error;
    }
  }

  async evaluateAnswer(
    userAnswer: string,
    correctAnswer: string,
    questionText: string,
    questionType?: QuestionTypeEnum,
  ): Promise<{ isCorrect: boolean; reason?: string }> {
    const normalizedUserAnswer = userAnswer.trim();
    const normalizedCorrectAnswer = correctAnswer.trim();

    if (!normalizedUserAnswer || !normalizedCorrectAnswer) {
      return { isCorrect: false, reason: 'Empty answer provided.' };
    }

    // Optimization: For Multiple Choice and True/False, use strict comparison
    if (
      questionType === QuestionTypeEnum.MULTIPLE_CHOICE ||
      questionType === QuestionTypeEnum.TRUE_FALSE
    ) {
      const isCorrect =
        normalizedUserAnswer.toLowerCase() ===
        normalizedCorrectAnswer.toLowerCase();
      return {
        isCorrect,
        reason: isCorrect ? 'Exact match.' : `Expected "${correctAnswer}".`,
      };
    }

    const userWords = normalizedUserAnswer.split(/\s+/).length;
    const correctWords = normalizedCorrectAnswer.split(/\s+/).length;
    const isShortAnswer = userWords <= 2 && correctWords <= 2;

    if (isShortAnswer) {
      const isCorrect =
        normalizedUserAnswer.toLowerCase() ===
        normalizedCorrectAnswer.toLowerCase();
      return {
        isCorrect,
        reason: isCorrect ? 'Exact match.' : `Expected "${correctAnswer}".`,
      };
    }

    try {
      const prompt = `
${PHILIPPINE_ACADEMIC_PERSONA}

You are evaluating exam answers for accuracy based on CPALE and Philippine Bar Exam standards. Determine if the student's answer is semantically equivalent to the correct answer.

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
  "reason": "Brief explanation (1-2 sentences) of why the answer is correct or incorrect. Correct the student if wrong."
}

Do not include any text before or after the JSON object.`;

      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);

      const parsedResponse = JSON.parse(cleanedText) as {
        isCorrect: boolean;
        reason?: string;
      };

      return {
        isCorrect: parsedResponse.isCorrect,
        reason:
          parsedResponse.reason ||
          (parsedResponse.isCorrect ? 'Correct.' : 'Incorrect.'),
      };
    } catch (error) {
      this.logger.error(
        `Error evaluating answer with AI: ${error instanceof Error ? error.message : String(error)}. Falling back to case-insensitive comparison.`,
      );

      const isCorrect =
        normalizedUserAnswer.toLowerCase() ===
        normalizedCorrectAnswer.toLowerCase();
      return { isCorrect, reason: 'AI evaluation error.' };
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
      - Elements and requisites based on Philippine Statutes
      - Article/section references (e.g., Civil Code Art. 1156)
      - Key definitions from Philippine Law
      - Philippine landmark cases and doctrines
      - Legal maxims with local context

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
      return await this.generateContent(prompt);
    } catch (error) {
      this.logger.error('Error generating summary:', error);
      throw error;
    }
  }

  async generateMathProblem(
    topic: string,
    context?: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
  ): Promise<{
    problem: string;
    solution: string;
    answer: string;
    explanation: string;
  }> {
    const prompt = `
      ${PHILIPPINE_ACADEMIC_PERSONA}
      
      Create a **unique, variable-based computational problem** for the topic: "${topic}".
      
      ${context ? `CONTEXT/SOURCE MATERIAL:\n${context}\n` : ''}

      DIFFICULTY: ${difficulty}

      ${LOCAL_CONTEXT_INJECTOR}

      REQUIREMENTS:
      1. **Scenario-Based:** Create a realistic scenario (e.g., "ABC Corp.", "Mr. Cruz").
      2. **New Numbers:** Generate random but realistic numbers for this specific problem. Do not use generic example numbers (e.g., instead of 100,000, use 124,500).
      3. **Process-Oriented:** The problem must require multiple steps to solve (e.g., gross income -> deductions -> taxable income -> tax due).
      4. **Step-by-Step Solution:** Provide a detailed computation trace showing exactly how the answer is derived.
      5. **Explanation:** Explain the principle/law being applied (e.g., "Under CREATE Law, corporate income tax is...").

      RESPONSE FORMAT:
      Respond with ONLY a JSON object in this exact format:
      {
        "problem": "The full text of the problem scenario...",
        "solution": "Step 1: ... \\nStep 2: ...",
        "answer": "The final numerical answer (formatted)",
        "explanation": "Brief explanation of the concept/principle used"
      }
      Do not include any text before or after the JSON.
    `;

    try {
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);
      const parsed = JSON.parse(cleanedText);

      return {
        problem: parsed.problem,
        solution: parsed.solution,
        answer: parsed.answer,
        explanation: parsed.explanation,
      };
    } catch (error) {
      this.logger.error('Error generating math problem:', error);
      throw new Error('Failed to generate math problem.');
    }
  }

  async generateCaseDigest(caseText: string): Promise<{
    title: string;
    citation: string;
    facts: string;
    issues: string[];
    ruling: string;
    ratio: string;
    doctrine: string;
  }> {
    const prompt = `
${PHILIPPINE_ACADEMIC_PERSONA}

Specialization: Legal Research and Case Analysis.

Generate a comprehensive CASE DIGEST from the following case text. Follow the standard Philippine law school format.

CASE TEXT:
---
${caseText}
---

${HALLUCINATION_GUARDRAIL}

RESPONSE FORMAT:
Return ONLY a JSON object with this exact structure:
{
  "title": "Case Name (e.g., People of the Philippines v. Juan Dela Cruz)",
  "citation": "G.R. No. XXXXX, Date, Ponente (e.g., G.R. No. 123456, January 1, 2024, J. Santos)",
  "facts": "Concise summary of material facts in paragraph form. Include: parties, relevant dates, transactions, and procedural history.",
  "issues": ["Issue 1: Whether...", "Issue 2: Whether..."],
  "ruling": "The Supreme Court GRANTED/DENIED the petition. [Summary of disposition]",
  "ratio": "The reasoning of the Court. Explain the legal analysis and how the Court applied the law to the facts.",
  "doctrine": "The legal principle established or reiterated. This is the quotable holding that can be cited in future cases."
}

GUIDELINES:
1. **Facts**: Be concise but complete. Include only material facts that affect the legal issues.
2. **Issues**: Frame as questions starting with "Whether..." 
3. **Ruling**: State the disposition clearly (granted, denied, affirmed, reversed, etc.)
4. **Ratio**: The "why" behind the ruling - the Court's legal reasoning
5. **Doctrine**: The abstract legal principle - suitable for citation in briefs

Do not include any text before or after the JSON.
    `;

    try {
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);
      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.error('Error generating case digest:', error);
      throw new Error('Failed to generate case digest.');
    }
  }

  async generateCodalFlashcards(
    articleText: string,
    lawName?: string,
  ): Promise<Array<{ front: string; back: string; category: string }>> {
    const prompt = `
${PHILIPPINE_ACADEMIC_PERSONA}

Generate comprehensive flashcards from this legal provision.

${lawName ? `LAW: ${lawName}` : ''}
ARTICLE/PROVISION TEXT:
---
${articleText}
---

${HALLUCINATION_GUARDRAIL}

FLASHCARD GENERATION RULES:
1. **Elements Cards**: If the provision has elements (e.g., elements of a crime, requisites of a contract), create one card per element
2. **Definition Cards**: Key terms must have their own definition cards
3. **Enumeration Cards**: Lists/enumerations should be broken into individual cards
4. **Exception Cards**: Any exceptions or qualifications get their own cards
5. **Penalty Cards**: If penalties are mentioned, create penalty-specific cards
6. **Comparison Cards**: If the provision distinguishes between concepts, create comparison cards

RESPONSE FORMAT:
Return ONLY a JSON array:
[
  {
    "front": "What are the elements of [concept]?",
    "back": "1. Element one\\n2. Element two\\n3. Element three",
    "category": "ELEMENTS"
  },
  {
    "front": "Define [term] under Article ___",
    "back": "[Definition from the provision]",
    "category": "DEFINITION"
  }
]

CATEGORIES: ELEMENTS, DEFINITION, REQUISITES, EXCEPTION, PENALTY, ENUMERATION, PROCEDURE, COMPARISON, GENERAL

Generate 5-15 flashcards depending on the complexity of the provision.
Do not include any text before or after the JSON.
    `;

    try {
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);
      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.error('Error generating codal flashcards:', error);
      throw new Error(
        'Failed to generate flashcards from the legal provision.',
      );
    }
  }

  async generateAuditProblem(
    topic: string,
    context?: string,
    difficulty: 'EASY' | 'MEDIUM' | 'HARD' = 'MEDIUM',
  ): Promise<{
    problem: string;
    given: string[];
    steps: Array<{
      step: number;
      description: string;
      computation: string;
      result: string;
    }>;
    finalAnswer: string;
    auditNote: string;
    relatedStandards: string[];
  }> {
    const prompt = `
${PHILIPPINE_ACADEMIC_PERSONA}

Create a STEP-BY-STEP AUDIT/COMPUTATION problem that mimics a professor's whiteboard solution.

TOPIC: ${topic}
DIFFICULTY: ${difficulty}
${context ? `CONTEXT:\n${context}` : ''}

${LOCAL_CONTEXT_INJECTOR}

REQUIREMENTS:
1. **Realistic Scenario**: Use a Philippine company name and realistic amounts (avoid round numbers like 100,000)
2. **Given Data**: List all provided information clearly
3. **Computation Trace**: Show EVERY step as a professor would on a whiteboard
4. **Audit Notes**: Include relevant audit procedures or considerations
5. **Standards Reference**: Cite applicable PAS/PFRS/PSA standards

RESPONSE FORMAT:
Return ONLY a JSON object:
{
  "problem": "Full problem statement with the scenario and what is being asked",
  "given": [
    "Sales revenue: ₱2,456,789",
    "Cost of goods sold: ₱1,234,567",
    "..."
  ],
  "steps": [
    {
      "step": 1,
      "description": "Calculate Gross Profit",
      "computation": "₱2,456,789 - ₱1,234,567",
      "result": "₱1,222,222"
    },
    {
      "step": 2,
      "description": "...",
      "computation": "...",
      "result": "..."
    }
  ],
  "finalAnswer": "The [answer] is ₱X,XXX,XXX",
  "auditNote": "Key audit considerations: [relevant audit procedures, assertions to test, common errors]",
  "relatedStandards": ["PAS 1, paragraph 82", "PFRS 15, paragraphs 31-34"]
}

Do not include any text before or after the JSON.
    `;

    try {
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);
      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.error('Error generating audit problem:', error);
      throw new Error('Failed to generate audit problem.');
    }
  }

  async findRelatedTopics(
    content: string,
    existingTopics: string[],
  ): Promise<Array<{ topic: string; relevance: number; reason: string }>> {
    if (existingTopics.length === 0) {
      return [];
    }

    const prompt = `
Analyze the following content and identify which existing topics it relates to.

NEW CONTENT:
---
${content.substring(0, 3000)}
---

EXISTING TOPICS:
${existingTopics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

For each related topic, provide:
1. The topic name (exactly as listed)
2. Relevance score (0-100, where 100 is highly relevant)
3. Brief reason for the connection

RESPONSE FORMAT:
Return ONLY a JSON array:
[
  {
    "topic": "Exact topic name from the list",
    "relevance": 85,
    "reason": "Both discuss tax computation under CREATE Law"
  }
]

Only include topics with relevance >= 50. Return empty array [] if no significant connections.
Do not include any text before or after the JSON.
    `;

    try {
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);
      const results = JSON.parse(cleanedText);
      return results.filter((r: { relevance: number }) => r.relevance >= 50);
    } catch (error) {
      this.logger.error('Error finding related topics:', error);
      return [];
    }
  }

  async generateSubTopics(
    parentTopic: string,
    subjectTitle: string,
  ): Promise<string[]> {
    const prompt = `
      You are an expert curriculum developer for the Philippine CPA Licensure Examination (CPALE).
      
      Generate a list of 3-7 distinct sub-topics for the topic "${parentTopic}" under the subject "${subjectTitle}".
      
      Requirements:
      - The sub-topics must be specific and relevant to the Philippine board exam syllabus (TOS).
      - Return ONLY the list of sub-topics as a valid JSON array of strings.
      - Do not include numbering or bullets in the strings.
      - Example output: ["Sub-topic 1", "Sub-topic 2", "Sub-topic 3"]
    `;

    try {
      const result = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(result);

      // Attempt to parse JSON
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: split by newlines if JSON parsing fails
      return result
        .split('\n')
        .map((line) => line.trim())
        .filter(
          (line) =>
            line.length > 0 && !line.startsWith('[') && !line.startsWith(']'),
        )
        .map((line) => line.replace(/^[-*•\d\.]+\s+/, '')); // Remove bullets/numbers
    } catch (error) {
      this.logger.error('Failed to generate sub-topics', error);
      return [];
    }
  }

  async generateTaxAdvice(query: string): Promise<{
    answer: string;
    citations: string[];
    disclaimer: string;
  }> {
    const prompt = `
      ${PHILIPPINE_ACADEMIC_PERSONA}

      You are acting as the "Bar Topnotcher" and "CPA Board Topnotcher" - the ultimate expert on Philippine Taxation Law.
      Your task is to answer the user's inquiry with **absolute precision, conservatism, and statutory basis.**

      USER INQUIRY: "${query}"

      ROLE & PERSONA:
      - You are formal, professional, and authoritative.
      - You DO NOT guess. If a tax rule is ambiguous, you state the ambiguity and cite relevant BIR Rulings or Supreme Court decisions that clarify or conflict.
      - You prioritize the **National Internal Revenue Code (Tax Code) as amended by TRAIN / CREATE / EOPT (Ease of Paying Taxes Act)**.
      
      ${HALLUCINATION_GUARDRAIL}
      
      COMPUTATION INSTRUCTIONS (CRITICAL):
      - If the query involves calculation (e.g., estate tax, income tax), you MUST perform a **Step-by-Step Chain of Thought** computation.
      - Show the formula used.
      - Show the substitution of values.
      - Show the final result in Philippine Pesos (₱).

      RESPONSE FORMAT:
      Return ONLY a JSON object with this exact structure:
      {
        "answer": "Direct, clear, and comprehensive answer. Use Markdown formatting. If computation is needed, include the step-by-step table or list here.",
        "citations": ["List specific legal bases here. Example: 'NIRC Sec. 32', 'RR 2-98'"],
        "disclaimer": "Standard professional disclaimer: 'Computed based on current laws as of 2024 (including EOPT Act). Consult a tax practitioner for specific filings.'"
      }

      GUIDELINES FOR ACCURACY:
      1. **Latest Laws**: Assume the EOPT (Ease of Paying Taxes) Act and latest RR are in effect.
      2. **Specifics**: Do not say "it depends" without explaining exactly WHAT it depends on.
      3. **Rates**: Verify tax rates (e.g., 8% optional rate vs graduated rates) mentally before generating.
      4. **Clarity**: Explain simple terms for students, but use technical terms for precision.

      Do not include any text before or after the JSON.
    `;

    try {
      const responseText = await this.generateContent(prompt);
      const cleanedText = this.cleanJson(responseText);
      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.error('Error generating tax advice:', error);
      throw new Error('Failed to generate tax advice.');
    }
  }

  // --- Helper Methods ---

  private cleanJson(text: string): string {
    let cleanedText = text.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText
        .replace(/^```json\s*/, '')
        .replace(/\s*```$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    return cleanedText;
  }

  private distributeQuestionTypes(
    totalCount: number,
    types: QuestionTypeEnum[],
  ): Map<QuestionTypeEnum, number> {
    const distribution = new Map<QuestionTypeEnum, number>();
    if (types.length === 0) return distribution;

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
      case 'FILL_IN_THE_BLANKS':
        return `
          Format: Active recall summary with blanked-out key terms.
          - Rewrite the content as a summary, but replace key keywords, numbers, or legal articles with "_______" (underscores).
          - Focus on critical information that a student needs to memorize (e.g., "The corporate term is _______ years.").
          - Number the blanks if necessary.
          - PROVIDE AN ANSWER KEY at the very bottom of the response, separated by a horizontal rule (---).
          - Ensure the context around the blank provides enough clues for a knowledgeable student to answer.
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
