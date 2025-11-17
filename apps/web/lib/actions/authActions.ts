"use server";

import { AuthLoginTypes } from "@repo/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function authLoginAction(values: AuthLoginTypes) {
  const cookieHeader = await cookies();
  
  // Add timeout to prevent hanging requests
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
  
  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(values),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
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

    // Set cookie immediately for faster redirect
    cookieHeader.set("access_token", token.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from "strict" to "lax" for better compatibility
      expires: expiresDate,
      path: "/",
    });

    return {
      success: true,
      data: { user: data.user },
      message: data.message || "Login successfully",
    };
  } catch (error) {
    // Always clear timeout on error
    clearTimeout(timeoutId);
    console.error("There is an unexpected error occured", error);
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return { success: false, error: "Request timed out. Please try again." };
      }
      if (error.message.includes('fetch') || error.message.includes('ECONNREFUSED')) {
        return { success: false, error: "Unable to connect to server. Please check your connection." };
      }
    }
    
    return { success: false, error: "There is an unexpected error occured" };
  }
}

export async function logoutAction() {
  console.log("triggered");
  const cookieHeader = await cookies();
  try {
    cookieHeader.delete("access_token");

    return { success: true };
  } catch (err) {
    console.error(
      "There is unexpected error occured while attempting to logout"
    );

    return {
      success: false,
      error: "There is unexpected error occured while attempting to logout",
    };
  }
}
