"use server";

import {
  ActionReturnType,
  CreateStudySessionTypes,
  UpdateStudySessionTypes,
} from "@repo/types";
import { StudySession, SessionStatusEnum } from "@repo/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export async function createStudySessionAction(
  values: CreateStudySessionTypes
): Promise<ActionReturnType<{ session: StudySession; userId: string }>> {
  const cookieHeader = await cookies();

  const token = cookieHeader.get("access_token");

  if (!token?.name || !token.value) {
    return { success: false, error: "Please login first" };
  }

  try {
    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/study-session`,
      {
        method: "POST",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        body: JSON.stringify(values),
        credentials: "include",
      }
    );

    const data: { session: StudySession; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to create study session",
      };
    }
    revalidateTag("study-sessions", "max");
    revalidatePath(`/${data.userId}/dashboard`);

    return { success: true, data, message: "Study session started" };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while attempting to create study session"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while attempting to create study session",
    };
  }
}

export async function getAllStudySessions(): Promise<
  ActionReturnType<{ sessions: StudySession[]; userId: string }>
> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/study-session`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    const data: { sessions: StudySession[]; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          "There is an error while attempting to fetch all study sessions",
      };
    }

    return { success: true, message: "Fetching sessions successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to fetch all study sessions"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to fetch all study sessions",
    };
  }
}

export async function getActiveStudySession(): Promise<
  ActionReturnType<{ session: StudySession | null; userId: string }>
> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/study-session/active`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    const data: { session: StudySession | null; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          "There is an error while attempting to fetch active study session",
      };
    }

    return { success: true, message: "Fetching active session successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to fetch active study session"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to fetch active study session",
    };
  }
}

export async function updateStudySessionAction(
  id: number,
  values: UpdateStudySessionTypes
): Promise<ActionReturnType<{ session: StudySession; userId: string }>> {
  try {
    const cookieHeader = await cookies();

    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/study-session/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        body: JSON.stringify(values),
        credentials: "include",
      }
    );

    const responseData: { session: StudySession; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "there is an error while attempting to update study session",
      };
    }
    revalidateTag("study-sessions", "max");
    revalidateTag("goals", "max"); // Invalidate goals cache when session is updated

    revalidatePath(`/${responseData.userId}/dashboard`);
    return {
      success: true,
      message: "Study session updated successfully!",
      data: responseData,
    };
  } catch (error) {
    console.error("Error updating study session:", error);
    return { success: false, error: "Failed to update study session." };
  }
}

