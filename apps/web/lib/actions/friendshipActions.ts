"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface UserSearchResult {
  id: string;
  name: string;
  email: string;
  friendshipStatus:
    | "none"
    | "pending_sent"
    | "pending_received"
    | "friends"
    | "blocked";
  friendshipId?: number;
}

export interface FriendRequest {
  id: number;
  status: string;
  createdAt: string;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  addressee: {
    id: string;
    name: string;
    email: string;
  };
}

export interface Friend {
  id: string;
  name: string;
  email: string;
  friendshipId: number;
  friendsSince: string;
}

export interface FriendshipCounts {
  friends: number;
  pendingReceived: number;
  pendingSent: number;
}

async function fetchFriendship<T>(
  endpoint: string,
  method: "GET" | "POST" | "DELETE" = "GET"
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
      return {
        success: false,
        error: (data as { message?: string })?.message || "An error occurred",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Friendship action error:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Search for users by name or email
 */
export async function searchUsers(
  query: string,
  limit = 10
): Promise<ActionReturnType<UserSearchResult[]>> {
  return fetchFriendship<UserSearchResult[]>(
    `/friendship/search?q=${encodeURIComponent(query)}&limit=${limit}`
  );
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(
  addresseeId: string
): Promise<ActionReturnType<FriendRequest>> {
  return fetchFriendship<FriendRequest>(
    `/friendship/request/${addresseeId}`,
    "POST"
  );
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(
  friendshipId: number
): Promise<ActionReturnType<FriendRequest>> {
  return fetchFriendship<FriendRequest>(
    `/friendship/accept/${friendshipId}`,
    "POST"
  );
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(
  friendshipId: number
): Promise<ActionReturnType<void>> {
  return fetchFriendship<void>(`/friendship/reject/${friendshipId}`, "DELETE");
}

/**
 * Cancel a sent friend request
 */
export async function cancelFriendRequest(
  friendshipId: number
): Promise<ActionReturnType<void>> {
  return fetchFriendship<void>(`/friendship/cancel/${friendshipId}`, "DELETE");
}

/**
 * Remove a friend (unfriend)
 */
export async function removeFriend(
  friendshipId: number
): Promise<ActionReturnType<void>> {
  return fetchFriendship<void>(`/friendship/remove/${friendshipId}`, "DELETE");
}

/**
 * Get pending friend requests (received)
 */
export async function getPendingRequests(): Promise<
  ActionReturnType<FriendRequest[]>
> {
  return fetchFriendship<FriendRequest[]>("/friendship/requests/pending");
}

/**
 * Get sent friend requests
 */
export async function getSentRequests(): Promise<
  ActionReturnType<FriendRequest[]>
> {
  return fetchFriendship<FriendRequest[]>("/friendship/requests/sent");
}

/**
 * Get all friends
 */
export async function getFriends(): Promise<ActionReturnType<Friend[]>> {
  return fetchFriendship<Friend[]>("/friendship/friends");
}

/**
 * Get friendship counts
 */
export async function getFriendshipCounts(): Promise<
  ActionReturnType<FriendshipCounts>
> {
  return fetchFriendship<FriendshipCounts>("/friendship/counts");
}

