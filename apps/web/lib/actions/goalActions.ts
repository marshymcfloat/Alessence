"use server";

import {
  ActionReturnType,
  CreateGoalTypes,
  UpdateGoalTypes,
} from "@repo/types";
import { StudyGoal } from "@repo/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export async function createGoalAction(
  values: CreateGoalTypes
): Promise<ActionReturnType<{ goal: StudyGoal; userId: string }>> {
  const cookieHeader = await cookies();

  const token = cookieHeader.get("access_token");

  if (!token?.name || !token.value) {
    return { success: false, error: "Please login first" };
  }

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/goal`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
      credentials: "include",
    });

    const data: { goal: StudyGoal; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to create goal",
      };
    }
    revalidateTag("goals", "max");
    revalidatePath(`/${data.userId}/dashboard`);

    return { success: true, data, message: "Goal created successfully" };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while attempting to create goal"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while attempting to create goal",
    };
  }
}

export async function getAllGoals(): Promise<
  ActionReturnType<{ goals: StudyGoal[]; userId: string }>
> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/goal`, {
      cache: "no-store",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data: { goals: StudyGoal[]; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch all goals",
      };
    }

    return { success: true, message: "Fetching goals successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to fetch all goals"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to fetch all goals",
    };
  }
}

export async function getActiveGoals(): Promise<
  ActionReturnType<{ goals: StudyGoal[]; userId: string }>
> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/goal/active`, {
      cache: "no-store",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data: { goals: StudyGoal[]; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch active goals",
      };
    }

    return { success: true, message: "Fetching active goals successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to fetch active goals"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to fetch active goals",
    };
  }
}

export async function getGoalsProgress(): Promise<
  ActionReturnType<{
    progress: Array<{
      goal: StudyGoal;
      currentMinutes: number;
      targetMinutes: number;
      progressPercentage: number;
      periodStart: Date;
      periodEnd: Date;
    }>;
    userId: string;
  }>
> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/goal/progress`, {
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
        error: "There is an error while attempting to fetch goals progress",
      };
    }

    return { success: true, message: "Fetching goals progress successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to fetch goals progress"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to fetch goals progress",
    };
  }
}

export async function updateGoalAction(
  id: number,
  values: UpdateGoalTypes
): Promise<ActionReturnType<{ goal: StudyGoal; userId: string }>> {
  try {
    const cookieHeader = await cookies();

    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/goal/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
      credentials: "include",
    });

    const responseData: { goal: StudyGoal; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "there is an error while attempting to update goal",
      };
    }
    revalidateTag("goals", "max");

    revalidatePath(`/${responseData.userId}/dashboard`);
    return {
      success: true,
      message: "Goal updated successfully!",
      data: responseData,
    };
  } catch (error) {
    console.error("Error updating goal:", error);
    return { success: false, error: "Failed to update goal." };
  }
}

export async function deleteGoalAction(
  id: number
): Promise<ActionReturnType<null>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/goal/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to delete goal.",
      };
    }

    const data = await response.json();
    revalidateTag("goals", "max");
    return {
      success: true,
      data: null,
      message: "Goal deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting goal:", error);
    return { success: false, error: "Failed to delete goal." };
  }
}

