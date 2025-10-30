"use server";

import {
  ActionReturnType,
  CreateNewSubjectReturnType,
  CreateSubjectTypes,
  GetAllSubjectReturnType,
} from "@repo/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

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

    if (!response) {
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
