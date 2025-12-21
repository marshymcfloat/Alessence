"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface WrongAnswer {
  question: {
    id: number;
    text: string;
    type: string;
    options: string[];
    correctAnswer: string;
  };
  attempts: Array<{
    attemptId: number;
    userAnswer: string;
    completedAt: string;
    attemptNumber: number;
  }>;
  totalWrongAttempts: number;
}

export interface WrongAnswerStatistics {
  totalAttempts: number;
  totalQuestions: number;
  totalWrongAnswers: number;
  uniqueWrongQuestions: number;
  wrongAnswerRate: number;
}

async function fetchWrongAnswers<T>(
  endpoint: string
): Promise<ActionReturnType<T>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}${endpoint}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch wrong answers",
      };
    }

    return {
      success: true,
      data,
      message: "Wrong answers fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching wrong answers:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching wrong answers",
    };
  }
}

export async function getWrongAnswers(examId: number) {
  return fetchWrongAnswers<WrongAnswer[]>(`/exam/${examId}/wrong-answers`);
}

export async function getWrongAnswerStatistics(examId: number) {
  return fetchWrongAnswers<WrongAnswerStatistics>(
    `/exam/${examId}/wrong-answers/statistics`
  );
}

