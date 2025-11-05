"use server";

import { TaskStatusEnum } from "@repo/db";
import {
  ActionReturnType,
  CreateNewTaskReturnType,
  CreateTaskTypes,
  GetAllTasksReturnType,
  UpdateTaskStatusReturnType,
} from "@repo/types";
import { revalidatePath, revalidateTag } from "next/cache";
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

    const data: CreateNewTaskReturnType = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to send",
      };
    }
    revalidateTag("tasks", "max");
    revalidatePath(`/${data.userId}/dashboard`);

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
      cache: "no-store", // Use 'no-store' for guaranteed fresh data on every call.

      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data: GetAllTasksReturnType = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch all tasks",
      };
    }

    return { success: true, message: "Fetching tasks successful", data };
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

export async function updateTaskStatus(
  id: number,
  status: TaskStatusEnum
): Promise<ActionReturnType<UpdateTaskStatusReturnType>> {
  const cookieHeader = await cookies();
  try {
    const token = cookieHeader.get("access_token");

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/task/${id}/status?status=${status}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          cookie: `${token?.name}=${token?.value}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.message || "There was an error updating the task."
      );
    }

    const data: UpdateTaskStatusReturnType = await response.json();
    revalidateTag("tasks", "max");
    revalidatePath(`/${data.userId}/dashboard`);
    return { success: true, data };
  } catch (error) {
    console.error(
      "There was an unexpected error while attempting to update status of a task",
      error
    );

    throw error;
  }
}

export async function updateTaskAction(
  id: number,
  data: CreateTaskTypes
): Promise<ActionReturnType<UpdateTaskStatusReturnType>> {
  try {
    const cookieHeader = await cookies();

    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/task/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(data),
      credentials: "include",
    });

    const responseData: UpdateTaskStatusReturnType = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "there is an error while attempting to patch task",
      };
    }
    revalidateTag("tasks", "max");

    revalidatePath(`/${responseData.userId}/dashboard`);
    return {
      success: true,
      message: "Task updated successfully!",
      data: responseData,
    };
  } catch (error) {
    console.error("Error updating task:", error);
    return { success: false, error: "Failed to update task." };
  }
}
