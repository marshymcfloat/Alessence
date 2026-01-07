import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { QuestionTypeEnum } from '@repo/db';
import { GeneratedQuestion } from './gemini.service';

@Injectable()
export class MockExamGeminiService {
  private readonly logger = new Logger(MockExamGeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private model: any;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY not found in environment variables');
      throw new Error('GEMINI_API_KEY not found');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async generateMockFinalsExam(
    context: string,
    description: string,
    itemCount: number,
    questionTypes: QuestionTypeEnum[],
  ): Promise<GeneratedQuestion[]> {
    const contextInstruction = context.trim()
      ? `Generate questions based ONLY on the provided SOURCE MATERIAL. Cross-reference with current Philippine professional standards where applicable.`
      : `CRITICAL: No SOURCE MATERIAL provided. You must use your internal expert knowledge of the standard Philippine Higher Education curriculum (CHED-aligned) for this subject. Generate questions that reflect the rigor of the Philippine CPA Licensure Exam (CPALE) or the Philippine Bar Exam.`;

    const prompt = `
      ROLE:
      You are a distinguished Senior Professor from a premier Philippine university (e.g., UP, Ateneo, De La Salle, UST, SJR-C) and a seasoned professional with dual qualifications: a Certified Public Accountant (CPA) and a Member of the Philippine Bar. 
      
      TASK:
      Create a rigorous, expert-level ${itemCount}-item practice exam that strictly follows the standards of Philippine Accountancy and Law.

      EXAM OBJECTIVE:
      Subject: "${description}".

      CORE REQUIREMENTS:
      1.  **Strict Localization**: ALL content must be based on Philippine Standards (PFRS/PAS for Accounting, Philippine Constitution/Statutes/Jurisprudence for Law). DO NOT use generic or US-based standards.
      2.  **High Complexity**: 
          -   Questions must go beyond simple definition.
          -   Focus on "Situational Analysis", "Complex Problem Solving", and "Case Study" style questions.
          -   Require the application of multiple concepts to arrive at the correct answer.
      3.  **Niche Focus**:
          -   For **Accounting**: Emphasize complex taxation rules, latest PFRS updates, and multi-step financial adjustments.
          -   For **Law**: Focus on nuanced interpretations of the law, conflicting rights, and recent Supreme Court decisions.
      4.  **Difficulty Distribution**:
          -   20% Easy (Foundational knowledge, but framed professionally)
          -   30% Average (Application of single concepts)
          -   50% Difficult (Integrative, multi-concept, case-based analysis)

      LOCALIZATION MANDATE (MOST IMPORTANT):
      1. ACCOUNTANCY: Questions must strictly follow the Philippine Financial Reporting Standards (PFRS), Philippine Accounting Standards (PAS), and the Philippine Tax Code (including latest TRAIN and CREATE Law updates). Do NOT use generic US GAAP or non-Philippine tax rates/rules.
      2. LAW: Questions must be based strictly on Philippine Jurisprudence, the Philippine Constitution, Civil Code, Revised Penal Code, Corporation Code, Labor Code, and other relevant Philippine statutes. Do NOT use international or common law principles that contradict Philippine civil law and statutory laws.
      3. CONTEXT: Use Philippine currency (Pesos), local business names, and scenarios typical of the Philippine socio-economic and legal landscape.
      
      OBJECTIVE:
      Push the student's capability to the limit. Identify gaps in deep understanding. This is a simulation of the "Finals" - it must be rigorous.
      
      ${contextInstruction}

      SOURCE MATERIAL (if any):
      ---
      ${context || 'NONE - USE INTERNAL KNOWLEDGE OF PHILIPPINE CURRICULUM'}
      ---

      QUESTION TYPES: ${questionTypes.join(', ')}

      CRITICAL QUALITY STANDARDS:
      1. COMPLEXITY: Questions must reach "Synthesis" and "Evaluation" levels of Bloom's Taxonomy. Include integrated scenarios (e.g., Audit + Taxation problems, or Civil Law + Remedial Law cases).
      2. ITEM RIGOR: Follow the "Bar Exam" or "Board Exam" style - clear but conceptually dense. 
      3. DISTRACTORS: Use high-quality distractors that represent common technical errors made by Philippine accountancy and law students.

      RESPONSE FORMAT:
      Your response MUST be a valid JSON array of objects. Do not include any text before or after the JSON array. Each object must follow this structure:
      
      [
        {
          "text": "The rigorous and complex question text.",
          "type": "MULTIPLE_CHOICE",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": "The precise correct option text."
        }
      ]

      IMPORTANT: This is a FINALS LEVEL exam for a Philippine student. It must be professional, local, and uncompromising.
    `;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) throw new Error('Empty response from Gemini');

      let cleanedText = text.trim();
      const jsonMatch = cleanedText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        cleanedText = jsonMatch[0];
      } else {
        // Fallback cleaning
        if (cleanedText.startsWith('```json')) {
          cleanedText = cleanedText
            .replace(/^```json\s*/, '')
            .replace(/\s*```$/, '');
        } else if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText
            .replace(/^```\s*/, '')
            .replace(/\s*```$/, '');
        }
      }

      return JSON.parse(cleanedText) as GeneratedQuestion[];
    } catch (error: any) {
      this.logger.error(`Error in MockExamGeminiService: ${error.message}`);
      throw error;
    }
  }
}
