"use server";

import { AuthLoginTypes, AuthRegisterTypes } from "@repo/types";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

// Helper function to make fetch request with timeout and retry
async function fetchWithTimeoutAndRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2,
  timeout = 8000
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      // Add connection timeout using a race condition
      const fetchPromise = fetch(url, {
        ...options,
        signal: controller.signal,
      });

      const response = await Promise.race([
        fetchPromise,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Connection timeout")), timeout)
        ),
      ]);

      clearTimeout(timeoutId);

      // If response is ok or a client/server error (4xx/5xx), return it
      // Don't retry on 4xx errors (client errors)
      if (response.status >= 400 && response.status < 500) {
        return response;
      }

      // Retry on network errors or 5xx errors
      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        lastError = new Error(`Server error: ${response.status}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
        continue;
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error) {
        // Don't retry on abort errors (timeout) or if it's the last attempt
        if (error.name === "AbortError" || attempt === maxRetries) {
          lastError = error;
          break;
        }

        // Retry on network errors
        if (
          error.message.includes("fetch") ||
          error.message.includes("ECONNREFUSED") ||
          error.message.includes("Connection timeout")
        ) {
          lastError = error;
          await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1))); // Exponential backoff
          continue;
        }
      }

      lastError = error instanceof Error ? error : new Error("Unknown error");
      break;
    }
  }

  throw lastError || new Error("Request failed after retries");
}

export async function authLoginAction(values: AuthLoginTypes) {
  const cookieHeader = await cookies();

  // Validate FETCH_BASE_URL is set
  if (!process.env.FETCH_BASE_URL) {
    console.error("FETCH_BASE_URL is not configured");
    return {
      success: false,
      error: "Server configuration error. Please contact support.",
    };
  }

  try {
    const response = await fetchWithTimeoutAndRetry(
      `${process.env.FETCH_BASE_URL}/auth/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      },
      2, // maxRetries
      8000 // timeout in ms (8 seconds)
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Login failed. Please check your credentials.",
      };
    }

    const { token, user } = data;
    if (!token || !user) {
      return { success: false, error: "Invalid response from server" };
    }

    const expiresDate = new Date(token.expires);

    // Set cookie immediately for faster redirect
    cookieHeader.set("access_token", token.value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresDate,
      path: "/",
    });

    return {
      success: true,
      data: { user: data.user },
      message: data.message || "Login successfully",
    };
  } catch (error) {
    console.error("Login error:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return {
          success: false,
          error: "Request timed out. The server may be slow. Please try again.",
        };
      }
      if (
        error.message.includes("fetch") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Connection timeout")
      ) {
        return {
          success: false,
          error: "Unable to connect to server. Please check your connection and ensure the server is running.",
        };
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function authRegisterAction(values: AuthRegisterTypes) {
  // Validate FETCH_BASE_URL is set
  if (!process.env.FETCH_BASE_URL) {
    console.error("FETCH_BASE_URL is not configured");
    return {
      success: false,
      error: "Server configuration error. Please contact support.",
    };
  }

  try {
    const response = await fetchWithTimeoutAndRetry(
      `${process.env.FETCH_BASE_URL}/auth/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
        }),
      },
      2, // maxRetries
      8000 // timeout in ms (8 seconds)
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Registration failed. Please try again.",
      };
    }

    return {
      success: true,
      data: { user: data },
      message: "Registration successful! Please sign in to continue.",
    };
  } catch (error) {
    console.error("Registration error:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.name === "AbortError" || error.message.includes("timeout")) {
        return {
          success: false,
          error: "Request timed out. The server may be slow. Please try again.",
        };
      }
      if (
        error.message.includes("fetch") ||
        error.message.includes("ECONNREFUSED") ||
        error.message.includes("Connection timeout")
      ) {
        return {
          success: false,
          error: "Unable to connect to server. Please check your connection and ensure the server is running.",
        };
      }
    }

    return {
      success: false,
      error: "An unexpected error occurred. Please try again.",
    };
  }
}

export async function getCurrentUser() {
  const cookieHeader = await cookies();
  const token = cookieHeader.get("access_token");

  if (!token?.value) {
    return {
      success: false,
      error: "Not authenticated",
      data: null,
    };
  }

  if (!process.env.FETCH_BASE_URL) {
    console.error("FETCH_BASE_URL is not configured");
    return {
      success: false,
      error: "Server configuration error. Please contact support.",
      data: null,
    };
  }

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/auth/me`, {
      method: "GET",
      headers: {
        Cookie: `${token.name}=${token.value}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to fetch user data.",
        data: null,
      };
    }

    const userData = await response.json();

    return {
      success: true,
      data: userData,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred.";
    console.error("Get Current User Action Error:", message);
    return {
      success: false,
      error: message,
      data: null,
    };
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
