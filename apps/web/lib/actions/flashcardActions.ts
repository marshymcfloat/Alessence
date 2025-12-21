"use server";

import {
  ActionReturnType,
  CreateFlashcardDeckTypes,
  UpdateFlashcardDeckTypes,
  CreateFlashcardTypes,
  UpdateFlashcardTypes,
  ReviewFlashcardTypes,
} from "@repo/types";
import { FlashcardDeck, Flashcard } from "@repo/db";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

// ========== DECK ACTIONS ==========

export async function createDeckAction(
  values: CreateFlashcardDeckTypes
): Promise<ActionReturnType<{ deck: FlashcardDeck; userId: string }>> {
  const cookieHeader = await cookies();
  const token = cookieHeader.get("access_token");

  if (!token?.name || !token.value) {
    return { success: false, error: "Please login first" };
  }

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/flashcard/deck`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
      credentials: "include",
    });

    const data: { deck: FlashcardDeck; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to create deck",
      };
    }
    revalidateTag("flashcard-decks", "max");
    revalidatePath(`/${data.userId}/dashboard`);

    return { success: true, data, message: "Deck created successfully" };
  } catch (error) {
    console.error("Error creating deck:", error);
    return {
      success: false,
      error: "There is an unexpected error occurred while attempting to create deck",
    };
  }
}

export async function getAllDecks(): Promise<
  ActionReturnType<{ decks: FlashcardDeck[]; userId: string }>
> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(`${process.env.FETCH_BASE_URL}/flashcard/deck`, {
      cache: "no-store",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      credentials: "include",
    });

    const data: { decks: FlashcardDeck[]; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch all decks",
      };
    }

    return { success: true, message: "Fetching decks successful", data };
  } catch (error) {
    console.error("Error fetching decks:", error);
    return {
      success: false,
      error: "There is an unexpected error occurred while trying to fetch all decks",
    };
  }
}

export async function getDeckById(
  id: number
): Promise<ActionReturnType<{ deck: FlashcardDeck; userId: string }>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/deck/${id}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    const data: { deck: FlashcardDeck; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch deck",
      };
    }

    return { success: true, message: "Fetching deck successful", data };
  } catch (error) {
    console.error("Error fetching deck:", error);
    return {
      success: false,
      error: "There is an unexpected error occurred while trying to fetch deck",
    };
  }
}

export async function updateDeckAction(
  id: number,
  values: UpdateFlashcardDeckTypes
): Promise<ActionReturnType<{ deck: FlashcardDeck; userId: string }>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/deck/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        body: JSON.stringify(values),
        credentials: "include",
      }
    );

    const responseData: { deck: FlashcardDeck; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "there is an error while attempting to update deck",
      };
    }
    revalidateTag("flashcard-decks", "max");
    revalidatePath(`/${responseData.userId}/dashboard`);
    return {
      success: true,
      message: "Deck updated successfully!",
      data: responseData,
    };
  } catch (error) {
    console.error("Error updating deck:", error);
    return { success: false, error: "Failed to update deck." };
  }
}

export async function deleteDeckAction(
  id: number
): Promise<ActionReturnType<null>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/deck/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to delete deck.",
      };
    }

    const data = await response.json();
    revalidateTag("flashcard-decks", "max");
    return {
      success: true,
      data: null,
      message: "Deck deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting deck:", error);
    return { success: false, error: "Failed to delete deck." };
  }
}

// ========== CARD ACTIONS ==========

export async function createCardAction(
  values: CreateFlashcardTypes
): Promise<ActionReturnType<{ card: Flashcard; userId: string }>> {
  const cookieHeader = await cookies();
  const token = cookieHeader.get("access_token");

  if (!token?.name || !token.value) {
    return { success: false, error: "Please login first" };
  }

  try {
    const response = await fetch(`${process.env.FETCH_BASE_URL}/flashcard/card`, {
      method: "POST",
      headers: {
        "Content-Type": "Application/json",
        cookie: `${token.name}=${token.value}`,
      },
      body: JSON.stringify(values),
      credentials: "include",
    });

    const data: { card: Flashcard; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to create card",
      };
    }
    revalidateTag("flashcard-cards", "max");
    revalidateTag("flashcard-decks", "max");

    return { success: true, data, message: "Card created successfully" };
  } catch (error) {
    console.error("Error creating card:", error);
    return {
      success: false,
      error: "There is an unexpected error occurred while attempting to create card",
    };
  }
}

export async function updateCardAction(
  id: number,
  values: UpdateFlashcardTypes
): Promise<ActionReturnType<{ card: Flashcard; userId: string }>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/card/${id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        body: JSON.stringify(values),
        credentials: "include",
      }
    );

    const responseData: { card: Flashcard; userId: string } =
      await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "there is an error while attempting to update card",
      };
    }
    revalidateTag("flashcard-cards", "max");
    return {
      success: true,
      message: "Card updated successfully!",
      data: responseData,
    };
  } catch (error) {
    console.error("Error updating card:", error);
    return { success: false, error: "Failed to update card." };
  }
}

export async function deleteCardAction(
  id: number
): Promise<ActionReturnType<null>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/card/${id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to delete card.",
      };
    }

    const data = await response.json();
    revalidateTag("flashcard-cards", "max");
    revalidateTag("flashcard-decks", "max");
    return {
      success: true,
      data: null,
      message: "Card deleted successfully.",
    };
  } catch (error) {
    console.error("Error deleting card:", error);
    return { success: false, error: "Failed to delete card." };
  }
}

// ========== REVIEW ACTIONS ==========

export async function getDueCards(
  deckId: number,
  limit: number = 100 // Increased to show all due cards
): Promise<ActionReturnType<{ cards: Flashcard[]; userId: string }>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/deck/${deckId}/due?limit=${limit}`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    const data: { cards: Flashcard[]; userId: string } = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch due cards",
      };
    }

    return { success: true, message: "Fetching due cards successful", data };
  } catch (error) {
    console.error("Error fetching due cards:", error);
    return {
      success: false,
      error: "There is an unexpected error occurred while trying to fetch due cards",
    };
  }
}

export async function reviewCardAction(
  values: ReviewFlashcardTypes
): Promise<ActionReturnType<{
  card: Flashcard;
  review: any;
  userId: string;
}>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/review`,
      {
        method: "POST",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        body: JSON.stringify(values),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to review card",
      };
    }

    revalidateTag("flashcard-cards", "max");
    return {
      success: true,
      message: "Card reviewed successfully!",
      data,
    };
  } catch (error) {
    console.error("Error reviewing card:", error);
    return { success: false, error: "Failed to review card." };
  }
}

export async function getDeckStatistics(
  deckId: number
): Promise<ActionReturnType<{
  statistics: {
    totalCards: number;
    dueCards: number;
    newCards: number;
    masteredCards: number;
    averageEaseFactor: number;
  };
  userId: string;
}>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/deck/${deckId}/statistics`,
      {
        cache: "no-store",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to fetch deck statistics",
      };
    }

    return { success: true, message: "Fetching statistics successful", data };
  } catch (error) {
    console.error("Error fetching statistics:", error);
    return {
      success: false,
      error: "There is an unexpected error occurred while trying to fetch statistics",
    };
  }
}

// ========== AI GENERATION ACTIONS ==========

export async function generateFlashcardsFromFiles(
  fileIds: number[],
  cardCount: number
): Promise<ActionReturnType<{
  cards: Array<{ front: string; back: string }>;
  userId: string;
}>> {
  try {
    const cookieHeader = await cookies();
    const token = cookieHeader.get("access_token");

    if (!token?.name || !token.value) {
      return { success: false, error: "Please login first" };
    }

    const response = await fetch(
      `${process.env.FETCH_BASE_URL}/flashcard/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "Application/json",
          cookie: `${token.name}=${token.value}`,
        },
        body: JSON.stringify({ fileIds, cardCount }),
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: "There is an error while attempting to generate flashcards",
      };
    }

    return { success: true, message: "Flashcards generated successfully", data };
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return {
      success: false,
      error: "There is an unexpected error occurred while trying to generate flashcards",
    };
  }
}

