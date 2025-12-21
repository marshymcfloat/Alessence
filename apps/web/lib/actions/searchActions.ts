"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface SearchResult {
  type: "note" | "task" | "file" | "exam";
  id: number;
  title: string;
  content?: string;
  metadata?: any;
}

export async function globalSearch(
  query: string
): Promise<ActionReturnType<{ results: SearchResult[]; userId: string }>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    if (!query || query.trim().length === 0) {
      return {
        success: true,
        data: { results: [], userId: "" },
        message: "Empty search query",
      };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/search?q=${encodeURIComponent(query)}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    const data: { results: SearchResult[]; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to search",
      };
    }

    return { success: true, message: "Search successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to search"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to search",
    };
  }
}

