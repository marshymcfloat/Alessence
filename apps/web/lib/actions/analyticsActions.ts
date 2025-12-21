"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface ExamScoreTrend {
  date: string;
  score: number;
  examId: number;
  examDescription: string;
  subjectId?: number;
  subjectTitle?: string;
}

export interface SubjectPerformance {
  subjectId: number;
  subjectTitle: string;
  averageScore: number;
  totalExams: number;
  totalAttempts: number;
  bestScore: number;
  worstScore: number;
}

export interface StudyTimeData {
  date: string;
  duration: number;
  sessionCount: number;
}

export interface TaskCompletionData {
  date: string;
  completed: number;
  total: number;
  completionRate: number;
}

export interface WeakArea {
  subjectId: number;
  subjectTitle: string;
  averageScore: number;
  examCount: number;
  recommendation: string;
}

async function fetchAnalytics<T>(
  endpoint: string,
  days?: number
): Promise<ActionReturnType<T>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const url = days
      ? `${process.env.FETCH_BASE_URL}${endpoint}?days=${days}`
      : `${process.env.FETCH_BASE_URL}${endpoint}`;

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch analytics",
      };
    }

    return { success: true, data, message: "Analytics fetched successfully" };
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching analytics",
    };
  }
}

export async function getExamScoreTrends(days: number = 30) {
  return fetchAnalytics<{ trends: ExamScoreTrend[]; userId: string }>(
    "/analytics/exam-score-trends",
    days
  );
}

export async function getSubjectPerformance() {
  return fetchAnalytics<{
    performance: SubjectPerformance[];
    userId: string;
  }>("/analytics/subject-performance");
}

export async function getStudyTimeAnalytics(days: number = 30) {
  return fetchAnalytics<{ data: StudyTimeData[]; userId: string }>(
    "/analytics/study-time",
    days
  );
}

export async function getTaskCompletionRates(days: number = 30) {
  return fetchAnalytics<{ data: TaskCompletionData[]; userId: string }>(
    "/analytics/task-completion",
    days
  );
}

export async function getWeakAreas() {
  return fetchAnalytics<{ weakAreas: WeakArea[]; userId: string }>(
    "/analytics/weak-areas"
  );
}

