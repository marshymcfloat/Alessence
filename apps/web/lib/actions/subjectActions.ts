"use server";

import { CreateSubjectTypes } from "@repo/types";
import { cookies } from "next/headers";

export async function createSubjectAction(values: CreateSubjectTypes) {
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
