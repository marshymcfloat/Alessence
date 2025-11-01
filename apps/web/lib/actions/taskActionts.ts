"use server";

import {
  ActionReturnType,
  CreateNewTaskReturnType,
  CreateTaskTypes,
  GetAllTasksReturnType,
} from "@repo/types";
import { cookies } from "next/headers";

export async function createTaskAction(
  values: CreateTaskTypes
): Promise<ActionReturnType<CreateNewTaskReturnType>> {
  const cookieHeader = await cookies();

  const token = cookieHeader.get("access_token");

  if (!token?.name || !token.value) {
    return { success: false, error: "Please login first" };
  }

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/task`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
      credentials: "include",
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to send",
      };
    }

    return { success: true, data, message: "success" };
  } catch (error) {
    console.error(
      "There is an unexpected error occured while attempting to create new task"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occured while attempting to create new task",
    };
  }
}

export async function getAllTasks(): Promise<
  ActionReturnType<GetAllTasksReturnType>
> {
  try {
    const cookieHeader = await cookies();

    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/task`, {
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
      next: { tags: ["tasks"] },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch all tasks",
      };
    }

    return { success: true, message: "Fetching tasks successful", data: data };
  } catch (error) {
    console.error(
      "There is an unexpected error occured while trying to fetch all tasks"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occured while trying to fetch all tasks",
    };
  }
}
