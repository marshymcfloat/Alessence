"use server";

import { ActionReturnType, CreateNewSummaryTypes } from "@repo/types";
import { cookies } from "next/headers";
import { File as DBFile, Summary } from "@repo/db";

export async function createSummary(
  values: CreateNewSummaryTypes
): Promise<ActionReturnType<{ summaryId: number }>> {
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

    formData.append("title", values.title);
    formData.append("description", values.description);
    formData.append("template", values.template || "COMPREHENSIVE");

    if (values.subjectId) {
      formData.append("subjectId", String(values.subjectId));
    }

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

    const response = await fetch(`${process.env.FETCH_BASE_URL}/summary`, {
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
        error: errorData.message || "Failed to create summary.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: { summaryId: data.id },
      message: "Summary is being generated!",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Create Summary Action Error:", message);
    return { success: false, error: message };
  }
}

export async function getAllSummaries(
  subjectId?: number
): Promise<ActionReturnType<{ summaries: Summary[] }>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const url = new URL(`${process.env.FETCH_BASE_URL}/summary`);
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
        error: errorData.message || "Failed to fetch summaries.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: { summaries: data },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Get All Summaries Action Error:", message);
    return { success: false, error: message };
  }
}

export async function getSummaryById(
  id: number
): Promise<ActionReturnType<{ summary: Summary }>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/summary/${id}`, {
      method: "GET",
      headers: {
        Cookie: `${token.name}=${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to fetch summary.",
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: { summary: data },
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Get Summary By ID Action Error:", message);
    return { success: false, error: message };
  }
}

export async function deleteSummary(id: number): Promise<ActionReturnType<null>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/summary/${id}`, {
      method: "DELETE",
      headers: {
        Cookie: `${token.name}=${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to delete summary.",
      };
    }

    return {
      success: true,
      data: null,
      message: "Summary deleted successfully.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Delete Summary Action Error:", message);
    return { success: false, error: message };
  }
}

