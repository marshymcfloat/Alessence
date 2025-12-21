"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface ExamAttemptHistory {
  id: number;
  score: number;
  status: string;
  startedAt: string;
  completedAt: string;
  totalQuestions: number;
  correctAnswers: number;
  examId: number;
  examDescription: string;
  subjectId: number;
  subjectTitle: string;
}

export interface ExamComparisonData {
  attemptNumber: number;
  date: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  duration?: number;
}

async function fetchExamHistory<T>(
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
        error: "There is an error while attempting to fetch exam history",
      };
    }

    return {
      success: true,
      data,
      message: "Exam history fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching exam history:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching exam history",
    };
  }
}

export async function getExamHistory(examId: number) {
  return fetchExamHistory<ExamAttemptHistory[]>(`/exam/${examId}/history`);
}

export async function getExamComparison(examId: number) {
  return fetchExamHistory<ExamComparisonData[]>(`/exam/${examId}/comparison`);
}

export async function getAttemptDetails(attemptId: number) {
  return fetchExamHistory<any>(`/exam/attempt/${attemptId}`);
}

