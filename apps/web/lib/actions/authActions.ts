"use server";

import { AuthLoginTypes } from "@repo/types";
import { cookies } from "next/headers";

export async function authLoginAction(values: AuthLoginTypes) {
  try {
    const cookieHeader = await cookies();
    const response = await fetch(`${process.env.FETCH_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
      },
      credentials: "include",
      body: JSON.stringify(values),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "There is error occured while fetching",
      };
    }

    const { token, user } = data;
    if (!token || !user) {
      return { success: false, error: "No token found" };
    }

    const expiresDate = new Date(token.expires);

    cookieHeader.set("access_token", token.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      expires: expiresDate,
      path: "/",
    });

    return {
      success: true,
      data: { user: data.user },
      message: data.message || "Login successfully",
    };
  } catch (error) {
    console.error("There is an unexpected error occured", error);
    return { success: false, error: "There is an unexpected error occured" };
  }
}
