"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatContext {
  subjectId?: number;
  fileIds?: number[];
  mode?: 'STANDARD' | 'SOCRATIC' | 'CITATION_VERIFICATION';
}

export interface ChatResponse {
  response: string;
  suggestedFollowUps: string[];
}

export interface PracticeQuestion {
  question: string;
  answer: string;
}

export interface ConversationSummary {
  id: number;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface Conversation {
  id: number;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface ChatWithHistoryResponse {
  conversationId: number;
  response: string;
  suggestedFollowUps: string[];
}

async function fetchAiChat<T>(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "POST",
  body?: unknown
): Promise<ActionReturnType<T>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const options: RequestInit = {
      method,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}${endpoint}`, options);

    // Handle empty responses for DELETE
    const contentType = response.headers.get("content-type");
    const isJson = contentType && contentType.includes("application/json");

    let data: unknown = null;
    if (isJson && response.status !== 204) {
      data = await response.json();
    }

    if (!response.ok) {
      return { success: false, error: (data as { message?: string })?.message || "An error occurred" };
    }

    return { success: true, data: data as T };
  } catch (error) {
    console.error("AI Chat action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Send a chat message to the AI assistant (stateless)
 */
export async function sendChatMessage(
  message: string,
  conversationHistory: ChatMessage[] = [],
  context?: ChatContext
): Promise<ActionReturnType<ChatResponse>> {
  return fetchAiChat<ChatResponse>("/ai-chat/message", "POST", {
    message,
    conversationHistory,
    context,
  });
}

/**
 * Send a chat message with persistent history
 */
export async function sendChatWithHistory(
  message: string,
  conversationId?: number | null,
  context?: ChatContext
): Promise<ActionReturnType<ChatWithHistoryResponse>> {
  return fetchAiChat<ChatWithHistoryResponse>("/ai-chat/chat", "POST", {
    message,
    conversationId,
    context,
  });
}

/**
 * Get all conversations
 */
export async function getConversations(): Promise<ActionReturnType<ConversationSummary[]>> {
  return fetchAiChat<ConversationSummary[]>("/ai-chat/conversations", "GET");
}

/**
 * Get a single conversation with messages
 */
export async function getConversation(conversationId: number): Promise<ActionReturnType<Conversation>> {
  return fetchAiChat<Conversation>(`/ai-chat/conversations/${conversationId}`, "GET");
}

/**
 * Create a new conversation
 */
export async function createConversation(): Promise<ActionReturnType<{ id: number; title: string }>> {
  return fetchAiChat<{ id: number; title: string }>("/ai-chat/conversations", "POST");
}

/**
 * Update conversation title
 */
export async function updateConversationTitle(
  conversationId: number,
  title: string
): Promise<ActionReturnType<{ id: number; title: string }>> {
  return fetchAiChat<{ id: number; title: string }>(`/ai-chat/conversations/${conversationId}`, "PATCH", { title });
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: number): Promise<ActionReturnType<{ success: boolean }>> {
  return fetchAiChat<{ success: boolean }>(`/ai-chat/conversations/${conversationId}`, "DELETE");
}

/**
 * Get a quick explanation for a concept
 */
export async function explainConcept(
  concept: string,
  context?: ChatContext
): Promise<ActionReturnType<{ explanation: string }>> {
  return fetchAiChat<{ explanation: string }>("/ai-chat/explain", "POST", {
    concept,
    context,
  });
}

/**
 * Generate practice questions for a topic
 */
export async function generatePracticeQuestions(
  topic: string,
  count: number = 5,
  context?: ChatContext
): Promise<ActionReturnType<{ questions: PracticeQuestion[] }>> {
  return fetchAiChat<{ questions: PracticeQuestion[] }>("/ai-chat/practice-questions", "POST", {
    topic,
    count,
    context,
  });
}

/**
 * Summarize content from files
 */
export async function summarizeContent(
  fileIds: number[],
  style: "brief" | "detailed" | "exam-focused" = "exam-focused"
): Promise<ActionReturnType<{ summary: string }>> {
  return fetchAiChat<{ summary: string }>("/ai-chat/summarize", "POST", {
    fileIds,
    style,
  });
}

