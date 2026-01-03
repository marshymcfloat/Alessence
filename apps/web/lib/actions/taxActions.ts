"use server";

import { ActionReturnType } from "@repo/types";
import { cookies } from "next/headers";

export interface TaxAdvice {
  answer: string;
  citations: string[];
  disclaimer: string;
}

export async function generateTaxAdvice(
  query: string
): Promise<ActionReturnType<TaxAdvice>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/law/tax-advice`, {
      method: "POST",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.message || "An error occurred",
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Tax action error:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
