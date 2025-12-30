"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface MathProblem {
  problem: string;
  solution: string;
  answer: string;
  explanation: string;
}

export interface AuditProblem {
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
}

async function fetchDrill<T>(
  endpoint: string,
  body?: unknown
): Promise<ActionReturnType<T>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}${endpoint}`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "An error occurred",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Drill action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

export interface GenerateDrillParams {
  topic: string;
  difficulty?: "EASY" | "MEDIUM" | "HARD";
  context?: string;
  subjectId?: number;
}

/**
 * Generate a variable math problem with randomized numbers
 */
export async function generateMathDrill(
  params: GenerateDrillParams
): Promise<ActionReturnType<MathProblem>> {
  return fetchDrill<MathProblem>("/drill/math", {
    topic: params.topic,
    difficulty: params.difficulty || "MEDIUM",
    context: params.context,
    subjectId: params.subjectId,
  });
}

/**
 * Generate a step-by-step audit/computation problem with detailed trace
 */
export async function generateAuditDrill(
  params: GenerateDrillParams
): Promise<ActionReturnType<AuditProblem>> {
  return fetchDrill<AuditProblem>("/drill/audit", {
    topic: params.topic,
    difficulty: params.difficulty || "MEDIUM",
    context: params.context,
    subjectId: params.subjectId,
  });
}
