"use server";

import { ActionReturnType, CreateNewExamTypes } from "@repo/types";
import { cookies } from "next/headers";
import { File as DBFile, Exam, Question } from "@repo/db";

export async function createExam(
  values: CreateNewExamTypes
): Promise<ActionReturnType<{ examId: number }>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const formData = new FormData();

    formData.append("describe", values.describe);
    formData.append("items", String(values.items));
    formData.append("subjectId", String(values.subjectId));
    formData.append("isPracticeMode", String(values.isPracticeMode));

    // Only append timeLimit if it has a value (not null/undefined)
    if (values.timeLimit != null) {
      formData.append("timeLimit", String(values.timeLimit));
    }

    values.questionTypes.forEach((type) => {
      formData.append("questionTypes[]", type);
    });

    const existingFileIds: number[] = [];
    values.files.forEach((file) => {
      if (file instanceof File) {
        formData.append("newFiles", file);
      } else {
        existingFileIds.push((file as DBFile).id);
      }
    });

    existingFileIds.forEach((id) => {
      formData.append("existingFileIds[]", String(id));
    });

    // 4. Send the multipart/form-data request
    const response = await fetch(`${process.env.FETCH_BASE_URL}/exam`, {
      method: "POST",
      headers: {
        Cookie: `${token.name}=${token.value}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to create exam.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: { examId: data.id },
      message: "Exam is being generated!",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Create Exam Action Error:", message);
    return { success: false, error: message };
  }
}

export async function getAllExams(
  subjectId?: number
): Promise<ActionReturnType<{ exams: Exam[] }>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const url = new URL(`${process.env.FETCH_BASE_URL}/exam`);
    if (subjectId) {
      url.searchParams.append("subjectId", String(subjectId));
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Cookie: `${token.name}=${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to fetch exams.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: { exams: data },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Get All Exams Action Error:", message);
    return { success: false, error: message };
  }
}

export async function getExamById(
  id: number
): Promise<ActionReturnType<{ exam: Exam & { questions: Question[] } }>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/exam/${id}`, {
      method: "GET",
      headers: {
        Cookie: `${token.name}=${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to fetch exam.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: { exam: data },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Get Exam By ID Action Error:", message);
    return { success: false, error: message };
  }
}

export async function createMockExam(
  subjectId: number,
  title?: string
): Promise<ActionReturnType<{ examId: number }>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/exam/mock`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify({ subjectId, title }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to create mock exam.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: { examId: data.id },
      message: "Mock exam is being generated!",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Create Mock Exam Action Error:", message);
    return { success: false, error: message };
  }
}

export async function deleteExam(id: number): Promise<ActionReturnType<null>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/exam/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: `${token.name}=${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to delete exam.",
      };
    }

    return {
      success: true,
      data: null,
      message: "Exam deleted successfully.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Delete Exam Action Error:", message);
    return { success: false, error: message };
  }
}

export async function evaluateAnswers(
  answers: Array<{ questionId: number; userAnswer: string }>
): Promise<
  ActionReturnType<
    Array<{ questionId: number; isCorrect: boolean; feedback?: string }>
  >
> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/exam/evaluate-answers`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `${token.name}=${token.value}`,
        },
        body: JSON.stringify({ answers }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to evaluate answers.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Evaluate Answers Action Error:", message);
    return { success: false, error: message };
  }
}
