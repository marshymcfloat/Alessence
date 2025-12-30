"use server";

import {
  ActionReturnType,
  CreateNewSubjectReturnType,
  CreateSubjectTypes,
  GetAllSubjectReturnType,
} from "@repo/types";
import { CreateTopicDTO } from "@repo/types/nest";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export interface Topic {
  id: number;
  title: string;
  subjectId: number;
  parentId: number | null;
  order: number;
  children?: Topic[];
}

export async function createSubjectAction(
  values: CreateSubjectTypes
): Promise<ActionReturnType<CreateNewSubjectReturnType>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) {
    return {
      success: false,
      error: "Unauthorized: No session token found.",
    };
  }

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/subject`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        Cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message ||
          "There is an error while fetching to create new subject",
      };
    }

    revalidatePath(`/${data.userId}/dashboard`);
    return {
      success: true,
      message: "Created subject successfully",
      data,
    };
  } catch (error) {
    console.error(
      "There is an unexpected error occured while posting a new subject",
      error
    );
    return {
      success: false,
      error: "There is an unexpected error occured while posting a new subject",
    };
  }
}

export async function getEnrolledSubject(): Promise<
  ActionReturnType<GetAllSubjectReturnType>
> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    const response = await fetch(`${process.env.FETCH_BASE_URL}/subject`, {
      headers: {
        "Content-Type": "Application/json",
        Cookie: `${token?.name}=${token?.value}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error:
          data.message ||
          "There is something wrong while attempting to fetch enrolled subjects",
      };
    }

    return { success: true, data: data };
  } catch (error) {
    console.error(
      "There was an unexpected error occured while fetching enrolled subjects"
    );
    return {
      success: false,
      error:
        "There was an unexpected error occured while fetching enrolled subjects",
    };
  }
}

export async function deleteSubjectAction(
  id: number
): Promise<ActionReturnType<null>> {
  try {
    const cookie = await cookies();
    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return {
        success: false,
        error: "Authentication failed. Please login again.",
      };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/subject/${id}`,
      {
        method: "DELETE",
        headers: {
          Cookie: `${token.name}=${token.value}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to delete subject.",
      };
    }

    const data = await response.json();
    revalidatePath(`/${data.userId}/dashboard`);

    return {
      success: true,
      data: null,
      message: "Subject deleted successfully.",
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Delete Subject Action Error:", message);
    return { success: false, error: message };
  }
}

// --- Topic Actions ---

export async function createTopicAction(
  values: CreateTopicDTO
): Promise<ActionReturnType<Topic>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/subject/topic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || "Failed to create topic" };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function getTopicsAction(
  subjectId: number
): Promise<ActionReturnType<Topic[]>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/subject/${subjectId}/topics`,
      {
        headers: { Cookie: `${token.name}=${token.value}` },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fetch topics" };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function deleteTopicAction(id: number): Promise<ActionReturnType<null>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/subject/topic/${id}`,
      {
        method: "DELETE",
        headers: { Cookie: `${token.name}=${token.value}` },
      }
    );

    if (!response.ok) {
      const data = await response.json();
      return { success: false, error: data.message || "Failed to delete topic" };
    }

    return { success: true, data: null };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function generateSubTopicsAction(parentTopicId: number): Promise<ActionReturnType<Topic[]>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/subject/topic/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify({ parentTopicId }),
    });

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || "Failed to generate sub-topics" };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function getSystemSyllabusAction(): Promise<ActionReturnType<any[]>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/subject/system-syllabus`,
      {
        headers: { Cookie: `${token.name}=${token.value}` },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fetch syllabus" };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}

export async function forkSubjectAction(subjectId: number): Promise<ActionReturnType<any>> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token");

  if (!token) return { success: false, error: "Unauthorized" };

  try {
    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/subject/${subjectId}/fork`,
      {
        method: "POST",
        headers: { Cookie: `${token.name}=${token.value}` },
      }
    );

    const data = await response.json();
    if (!response.ok) {
      return { success: false, error: data.message || "Failed to fork subject" };
    }

    revalidatePath(`/dashboard`); // Conservative revalidate
    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Unexpected error" };
  }
}