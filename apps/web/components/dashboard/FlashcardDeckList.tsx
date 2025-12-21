"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllDecks, deleteDeckAction } from "@/lib/actions/flashcardActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, BookOpen, Plus, Play } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { FlashcardDeck } from "@repo/db/client-types";

export function FlashcardDeckList() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["flashcard-decks"],
    queryFn: getAllDecks,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDeckAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || "Deck deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
      } else {
        toast.error(result.error || "Failed to delete deck");
      }
    },
    onError: () => {
      toast.error("Failed to delete deck");
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !data?.success || !data.data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center py-4">
          Failed to load flashcard decks
        </p>
      </Card>
    );
  }

  const decks = data.data.decks;

  if (decks.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            No flashcard decks yet
          </p>
          <p className="text-xs text-muted-foreground">
            Create your first deck to get started
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {decks.map((deck: FlashcardDeck & { _count?: { cards: number } }) => (
        <Card key={deck.id} className="p-6 hover:bg-muted/50 transition-colors">
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-1">{deck.title}</h3>
                {deck.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {deck.description}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {(deck as any).subject && (
                <Badge variant="outline">
                  {(deck as any).subject.title}
                </Badge>
              )}
              <Badge variant="secondary">
                {(deck as any)._count?.cards || 0} cards
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={() => {
                  const pathParts = window.location.pathname.split('/');
                  const userId = pathParts[1];
                  router.push(`/${userId}/flashcard/deck/${deck.id}`);
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Study
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const pathParts = window.location.pathname.split('/');
                  const userId = pathParts[1];
                  router.push(`/${userId}/flashcard/deck/${deck.id}`);
                }}
              >
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this deck?")) {
                    deleteMutation.mutate(deck.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}

