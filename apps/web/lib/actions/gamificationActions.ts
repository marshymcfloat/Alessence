"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface StreakData {
  current: number;
  longest: number;
  totalDays: number;
  lastStudyDate: string | null;
}

export interface XPData {
  total: number;
  level: number;
  currentLevelXP: number;
  nextLevelXP: number;
  progress: number;
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

export interface AchievementsData {
  unlocked: Achievement[];
  locked: Achievement[];
  total: number;
  unlockedCount: number;
}

export interface GamificationStats {
  streak: StreakData;
  xp: XPData;
  achievements: AchievementsData;
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
 * Get user's gamification stats (streak, XP, achievements)
 */
export async function getGamificationStats(): Promise<ActionReturnType<GamificationStats>> {
  return fetchGamification<GamificationStats>("/gamification/stats");
}

/**
 * Get all achievements
 */
export async function getAllAchievements(): Promise<ActionReturnType<Achievement[]>> {
  return fetchGamification<Achievement[]>("/gamification/achievements");
}

/**
 * Record study activity (updates streak)
 */
export async function recordStudyActivity(): Promise<ActionReturnType<StreakData>> {
  return fetchGamification<StreakData>("/gamification/record-activity", "POST");
}

