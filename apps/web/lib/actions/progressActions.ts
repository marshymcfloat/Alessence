"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface StreakData {
  current: number;
  longest: number;
  totalDays: number;
  lastStudyDate: string | null;
}

export interface ProfileData {
  totalPoints: number;
  level: number;
  rank: string;
  nextRank: string;
  progress: number;
}

export interface MasteryData {
  subject: string;
  score: number;
  lastActivity: string;
}

export interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: number;
  xpReward: number;
  unlockedAt?: string;
}

export interface BadgesData {
  unlocked: Achievement[];
  locked: Achievement[];
  total: number;
  unlockedCount: number;
}

export interface GamificationStats {
  streak: StreakData;
  profile: ProfileData;
  mastery: MasteryData[];
  badges: BadgesData;
  heatmap: { date: string; count: number }[];
  // Legacy compatibility fields
  xp: {
    total: number;
    level: number;
    currentLevelXP: number;
    nextLevelXP: number;
    progress: number;
  };
  achievements: BadgesData;
}

async function fetchGamification<T>(
  endpoint: string,
  method: "GET" | "POST" = "GET",
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
      return { success: false, error: errorData.message || "An error occurred" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Gamification action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get user's gamification stats (streak, profile, mastery, badges)
 */
export async function getGamificationStats(): Promise<ActionReturnType<GamificationStats>> {
  return fetchGamification<GamificationStats>("/progress/stats");
}

/**
 * Get all achievements/badges
 */
export async function getAllAchievements(): Promise<ActionReturnType<Achievement[]>> {
  return fetchGamification<Achievement[]>("/progress/achievements");
}

export interface WeakTopic {
  topicId: number;
  title: string;
  subject: string;
  strength: number;
  nextReviewAt: string;
  reason: string;
}

/**
 * Get user's weak topics
 */
export async function getWeakTopics(): Promise<ActionReturnType<WeakTopic[]>> {
  return fetchGamification<WeakTopic[]>("/progress/weak-topics");
}

/**
 * Record study activity (updates streak)
 */
export async function recordStudyActivity(): Promise<ActionReturnType<StreakData>> {
  return fetchGamification<StreakData>("/progress/record-activity", "POST");
}
