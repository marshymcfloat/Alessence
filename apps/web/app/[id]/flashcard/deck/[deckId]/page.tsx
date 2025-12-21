"use client";

import { FlashcardDeckView } from "@/components/dashboard/FlashcardDeckView";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";

export default function FlashcardDeckPage() {
  const router = useRouter();
  const params = useParams();
  const deckId = Number(params.deckId);
  const userId = params.id as string;

  return (
    <div className="container mx-auto py-8 space-y-4">
      <Button
        variant="ghost"
        onClick={() => router.push(`/${userId}/flashcard`)}
        className="mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Decks
      </Button>
      <FlashcardDeckView deckId={deckId} />
    </div>
  );
}
