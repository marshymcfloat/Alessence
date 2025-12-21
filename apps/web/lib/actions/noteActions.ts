"use server";

import {
  ActionReturnType,
  CreateNoteTypes,
  UpdateNoteTypes,
} from "@repo/types";
import { Note } from "@repo/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

export async function createNoteAction(
  values: CreateNoteTypes
): Promise<ActionReturnType<{ note: Note; userId: string }>> {
  const cookieHeader = await cookies();

  const token = cookieHeader.get("access_token");

  if (!token?.name || !token.value) {
    return { success: false, error: "Please login first" };
  }

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/note`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
      credentials: "include",
    });

    const data: { note: Note; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to create note",
      };
    }
    revalidateTag("notes", "max");
    revalidatePath(`/${data.userId}/dashboard`);

    return { success: true, data, message: "Note created successfully" };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while attempting to create note"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while attempting to create note",
    };
  }
}

export async function getAllNotes(
  search?: string
): Promise<ActionReturnType<{ notes: Note[]; userId: string }>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const url = search
      ? `${process.env.FETCH_BASE_URL}/note?search=${encodeURIComponent(search)}`
      : `${process.env.FETCH_BASE_URL}/note`;

    const response = await fetch(url, {
      cache: "no-store",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data: { notes: Note[]; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch all notes",
      };
    }

    return { success: true, message: "Fetching notes successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to fetch all notes"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to fetch all notes",
    };
  }
}

export async function getNoteById(
  id: number
): Promise<ActionReturnType<{ note: Note; userId: string }>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/note/${id}`, {
      cache: "no-store",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data: { note: Note; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch note",
      };
    }

    return { success: true, message: "Fetching note successful", data };
  } catch (error) {
    console.error(
      "There is an unexpected error occurred while trying to fetch note"
    );
    return {
      success: false,
      error:
        "There is an unexpected error occurred while trying to fetch note",
    };
  }
}

export async function updateNoteAction(
  id: number,
  values: UpdateNoteTypes
): Promise<ActionReturnType<{ note: Note; userId: string }>> {
  try {
    const cookieHeader = await cookies();

    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/note/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
      credentials: "include",
    });

    const responseData: { note: Note; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "there is an error while attempting to update note",
      };
    }
    revalidateTag("notes", "max");

    revalidatePath(`/${responseData.userId}/dashboard`);
    return {
      success: true,
      message: "Note updated successfully!",
      data: responseData,
    };
  } catch (error) {
    console.error("Error updating note:", error);
    return { success: false, error: "Failed to update note." };
  }
}

export async function deleteNoteAction(
  id: number
): Promise<ActionReturnType<null>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/note/${id}`, {
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
        error: errorData.message || "Failed to delete note.",
      };
    }

    revalidateTag("notes", "max");
    return {
      success: true,
      data: null,
      message: "Note deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting note:", error);
    return { success: false, error: "Failed to delete note." };
  }
}

