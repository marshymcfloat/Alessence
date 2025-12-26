"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface SharedFileItem {
  id: number;
  permission: string;
  createdAt: string;
  owner: { id: string; name: string; email: string; profilePicture: string | null };
  file: { id: number; name: string; type: string; fileUrl: string };
}

export interface SharedNoteItem {
  id: number;
  permission: string;
  createdAt: string;
  owner: { id: string; name: string; email: string; profilePicture: string | null };
  note: { id: number; title: string; content: string; isMarkdown: boolean };
}

export interface SharedDeckItem {
  id: number;
  permission: string;
  createdAt: string;
  owner: { id: string; name: string; email: string; profilePicture: string | null };
  deck: { id: number; title: string; description: string | null; _count: { cards: number } };
}

export interface SharedSummary {
  files: number;
  notes: number;
  decks: number;
  total: number;
}

async function fetchSharing<T>(
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET",
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

    // Handle empty responses (common for DELETE requests)
    const text = await response.text();
    let data: T | undefined;
    
    if (text) {
      try {
        data = JSON.parse(text) as T;
      } catch {
        // Response is not JSON, that's okay for DELETE requests
      }
    }

    if (!response.ok) {
      return { success: false, error: (data as { message?: string })?.message || "An error occurred" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Sharing action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

// ==================== FILES ====================

export async function shareFile(
  fileId: number,
  recipientId: string,
  permission: "VIEW" | "COPY" = "VIEW"
) {
  return fetchSharing(`/sharing/file/${fileId}`, "POST", { recipientId, permission });
}

export async function unshareFile(shareId: number) {
  return fetchSharing(`/sharing/file/${shareId}`, "DELETE");
}

export async function getFilesSharedWithMe(): Promise<ActionReturnType<SharedFileItem[]>> {
  return fetchSharing<SharedFileItem[]>("/sharing/files/received");
}

export async function getFilesSharedByMe() {
  return fetchSharing("/sharing/files/sent");
}

// ==================== NOTES ====================

export async function shareNote(
  noteId: number,
  recipientId: string,
  permission: "VIEW" | "COPY" = "VIEW"
) {
  return fetchSharing(`/sharing/note/${noteId}`, "POST", { recipientId, permission });
}

export async function unshareNote(shareId: number) {
  return fetchSharing(`/sharing/note/${shareId}`, "DELETE");
}

export async function getNotesSharedWithMe(): Promise<ActionReturnType<SharedNoteItem[]>> {
  return fetchSharing<SharedNoteItem[]>("/sharing/notes/received");
}

export async function getNotesSharedByMe() {
  return fetchSharing("/sharing/notes/sent");
}

// ==================== FLASHCARD DECKS ====================

export async function shareDeck(
  deckId: number,
  recipientId: string,
  permission: "VIEW" | "COPY" = "VIEW"
) {
  return fetchSharing(`/sharing/deck/${deckId}`, "POST", { recipientId, permission });
}

export async function unshareDeck(shareId: number) {
  return fetchSharing(`/sharing/deck/${shareId}`, "DELETE");
}

export async function getDecksSharedWithMe(): Promise<ActionReturnType<SharedDeckItem[]>> {
  return fetchSharing<SharedDeckItem[]>("/sharing/decks/received");
}

export async function getDecksSharedByMe() {
  return fetchSharing("/sharing/decks/sent");
}

export async function copySharedDeck(shareId: number, subjectId?: number) {
  return fetchSharing(`/sharing/deck/${shareId}/copy`, "POST", { subjectId });
}

// ==================== SUMMARY ====================

export async function getSharedSummary(): Promise<ActionReturnType<SharedSummary>> {
  return fetchSharing<SharedSummary>("/sharing/summary");
}

