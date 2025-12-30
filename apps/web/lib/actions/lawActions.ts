"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface CaseDigest {
  title: string;
  citation: string;
  facts: string;
  issues: string[];
  ruling: string;
  ratio: string;
  doctrine: string;
}

export interface CodalFlashcard {
  front: string;
  back: string;
  category: string;
}

async function fetchLaw<T>(
  endpoint: string,
  method: "GET" | "POST" = "POST",
  body?: unknown
): Promise<ActionReturnType<T>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}${endpoint}`, {
      method,
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
    console.error("Law action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Generate a structured case digest from full case text
 */
export async function generateCaseDigest(
  caseText: string
): Promise<ActionReturnType<CaseDigest>> {
  return fetchLaw<CaseDigest>("/law/case-digest", "POST", { caseText });
}

/**
 * Generate flashcards from a legal codal article/provision
 */
export async function generateCodalFlashcards(
  articleText: string,
  lawName?: string,
  deckId?: number
): Promise<ActionReturnType<{ flashcards: CodalFlashcard[]; savedCount?: number }>> {
  return fetchLaw<{ flashcards: CodalFlashcard[]; savedCount?: number }>(
    "/law/codal-flashcards",
    "POST",
    { articleText, lawName, deckId }
  );
}

/**
 * Generate flashcards from an uploaded file containing legal articles
 */
export async function generateFlashcardsFromFile(
  fileId: number,
  deckId?: number
): Promise<ActionReturnType<{ flashcards: CodalFlashcard[]; savedCount?: number }>> {
  return fetchLaw<{ flashcards: CodalFlashcard[]; savedCount?: number }>(
    "/law/codal-flashcards/from-file",
    "POST",
    { fileId, deckId }
  );
}

