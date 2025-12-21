"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface CalendarEvent {
  id: number;
  type: "task" | "exam" | "study_session";
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  color?: string;
  metadata?: any;
}

async function fetchCalendar<T>(
  endpoint: string,
  params?: Record<string, string>
): Promise<ActionReturnType<T>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const queryString = params
      ? `?${new URLSearchParams(params).toString()}`
      : "";
    const url = `${process.env.FETCH_BASE_URL}${endpoint}${queryString}`;

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch calendar events",
      };
    }

    return {
      success: true,
      data,
      message: "Calendar events fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return {
      success: false,
      error: "An unexpected error occurred while fetching calendar events",
    };
  }
}

export async function getCalendarEvents(
  startDate?: string,
  endDate?: string
) {
  const params: Record<string, string> = {};
  if (startDate) params.start = startDate;
  if (endDate) params.end = endDate;

  return fetchCalendar<{ events: CalendarEvent[]; userId: string }>(
    "/calendar/events",
    params
  );
}

export async function getEventsForDate(date: string) {
  return fetchCalendar<{ events: CalendarEvent[]; userId: string }>(
    "/calendar/events/date",
    { date }
  );
}

