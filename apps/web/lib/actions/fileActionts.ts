"use server";

import { ActionReturnType, getAllFilesReturnType } from "@repo/types";
import { cookies } from "next/headers";

export async function getAllFiles(): Promise<
  ActionReturnType<getAllFilesReturnType>
> {
  try {
    const cookie = await cookies();

    const token = cookie.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/file`, {
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data: getAllFilesReturnType = await response.json();
    if (!response.ok) {
      return {
        success: false,
        error: "There is an error occured while attempting to fetch files",
      };
    }

    return { success: true, data };
  } catch (err) {
    console.error(
      "There is an unexpected error occured while attempting to fetch files"
    );

    if (err instanceof Error) {
      console.error(err.message);
    }

    return {
      success: false,
      error:
        "There is an unexpected error occured while attempting to fetch files",
    };
  }
}

export async function uploadFile() {}
