"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  profilePicture: string | null;
  bio: string | null;
  createdAt: string;
  stats: {
    exams: number;
    flashcardDecks: number;
    notes: number;
    studySessions: number;
  };
  gamification: {
    streak: number;
    longestStreak: number;
    totalStudyDays: number;
    level: number;
    totalXp: number;
    xpProgress: number;
    recentAchievements: Array<{
      id: number;
      code: string;
      name: string;
      description: string;
      icon: string;
      category: string;
      xpReward: number;
      unlockedAt: string;
    }>;
  };
}

export interface PublicProfile {
  id: string;
  name: string;
  profilePicture: string | null;
  bio: string | null;
  createdAt: string;
  isFriend: boolean;
  gamification: {
    streak: number;
    level: number;
    achievementCount: number;
  };
}

export interface UpdateProfileDto {
  name?: string;
  bio?: string;
}

async function fetchProfile<T>(
  endpoint: string,
  method: "GET" | "POST" | "PATCH" | "DELETE" = "GET",
  body?: unknown | FormData
): Promise<ActionReturnType<T>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const isFormData = body instanceof FormData;
    const headers: Record<string, string> = {
      cookie: `${token.name}=${token.value}`,
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}${endpoint}`, {
      method,
      cache: "no-store",
      headers,
      credentials: "include",
      body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, error: errorData.message || "An error occurred" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Profile action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get current user's profile
 */
export async function getMyProfile(): Promise<ActionReturnType<UserProfile>> {
  return fetchProfile<UserProfile>("/profile");
}

/**
 * Update profile
 */
export async function updateProfile(dto: UpdateProfileDto): Promise<ActionReturnType<UserProfile>> {
  return fetchProfile<UserProfile>("/profile", "PATCH", dto);
}

/**
 * Upload profile picture
 */
export async function uploadProfilePicture(formData: FormData): Promise<ActionReturnType<UserProfile>> {
  return fetchProfile<UserProfile>("/profile/picture", "POST", formData);
}

/**
 * Remove profile picture
 */
export async function removeProfilePicture(): Promise<ActionReturnType<UserProfile>> {
  return fetchProfile<UserProfile>("/profile/picture", "DELETE");
}

/**
 * Get public profile of another user
 */
export async function getPublicProfile(userId: string): Promise<ActionReturnType<PublicProfile>> {
  return fetchProfile<PublicProfile>(`/profile/${userId}`);
}

