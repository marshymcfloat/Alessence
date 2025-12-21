"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDeckById,
  deleteCardAction,
  getDeckStatistics,
} from "@/lib/actions/flashcardActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Trash2,
  Edit,
  Play,
  BookOpen,
  BarChart3,
  Search,
  Eye,
  Star,
  Clock,
  CheckCircle,
  Brain,
  AlertCircle,
  Grid,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { FlashcardEditor } from "./FlashcardEditor";
import { FlashcardReview } from "./FlashcardReview";
import { GenerateFlashcardsDialog } from "./GenerateFlashcardsDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Flashcard } from "@repo/db/client-types";

interface FlashcardDeckViewProps {
  deckId: number;
}

type CardStatus = "new" | "learning" | "due" | "mastered" | "difficult";

function getCardStatus(card: Flashcard): CardStatus {
  if (card.repetitions === 0) return "new";
  if (card.easeFactor < 2.0) return "difficult";
  if (card.nextReviewAt && new Date(card.nextReviewAt) <= new Date())
    return "due";
  if (card.repetitions >= 3 && card.easeFactor >= 2.5) return "mastered";
  return "learning";
}

function getStatusBadge(status: CardStatus) {
  switch (status) {
    case "new":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
        >
          <Star className="w-3 h-3 mr-1" />
          New
        </Badge>
      );
    case "learning":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300"
        >
          <Brain className="w-3 h-3 mr-1" />
          Learning
        </Badge>
      );
    case "due":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300"
        >
          <Clock className="w-3 h-3 mr-1" />
          Due
        </Badge>
      );
    case "mastered":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
        >
          <CheckCircle className="w-3 h-3 mr-1" />
          Mastered
        </Badge>
      );
    case "difficult":
      return (
        <Badge
          variant="secondary"
          className="bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300"
        >
          <AlertCircle className="w-3 h-3 mr-1" />
          Difficult
        </Badge>
      );
    default:
      return null;
  }
}

export function FlashcardDeckView({ deckId }: FlashcardDeckViewProps) {
  const queryClient = useQueryClient();
  const [editingCard, setEditingCard] = useState<Flashcard | null>(null);
  const [isCreatingCard, setIsCreatingCard] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<CardStatus | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [previewCard, setPreviewCard] = useState<Flashcard | null>(null);

  const { data: deckData, isLoading: deckLoading } = useQuery({
    queryKey: ["flashcard-deck", deckId],
    queryFn: () => getDeckById(deckId),
  });

  const { data: statsData } = useQuery({
    queryKey: ["flashcard-statistics", deckId],
    queryFn: () => getDeckStatistics(deckId),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCardAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success(result.message || "Card deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["flashcard-deck", deckId] });
        queryClient.invalidateQueries({
          queryKey: ["flashcard-statistics", deckId],
        });
      } else {
        toast.error(result.error || "Failed to delete card");
      }
    },
  });

  const deck = deckData?.data?.deck;
  const cards: Flashcard[] = useMemo(() => {
    return ((deck as any)?.cards || []) as Flashcard[];
  }, [deck]);

  const statistics = statsData?.data?.statistics;

  // Filter cards
  const filteredCards = useMemo(() => {
    let filtered = cards;

    // Apply status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(
        (card) => getCardStatus(card) === filterStatus
      );
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (card) =>
          card.front.toLowerCase().includes(query) ||
          card.back.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [cards, filterStatus, searchQuery]);

  // Calculate card counts by status
  const cardCounts = useMemo(() => {
    const counts = { new: 0, learning: 0, due: 0, mastered: 0, difficult: 0 };
    cards.forEach((card) => {
      const status = getCardStatus(card);
      counts[status]++;
    });
    return counts;
  }, [cards]);

  if (deckLoading || !deckData?.success || !deck) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (isReviewing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{deck.title}</h2>
          <Button variant="outline" onClick={() => setIsReviewing(false)}>
            Exit Review
          </Button>
        </div>
        <FlashcardReview
          deckId={deckId}
          onComplete={() => {
            setIsReviewing(false);
            queryClient.invalidateQueries({
              queryKey: ["flashcard-deck", deckId],
            });
            queryClient.invalidateQueries({
              queryKey: ["flashcard-statistics", deckId],
            });
          }}
        />
      </div>
    );
  }

  if (isCreatingCard || editingCard) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {editingCard ? "Edit Card" : "Create New Card"}
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              setIsCreatingCard(false);
              setEditingCard(null);
            }}
          >
            Cancel
          </Button>
        </div>
        <FlashcardEditor
          deckId={deckId}
          card={editingCard || undefined}
          onSuccess={() => {
            setIsCreatingCard(false);
            setEditingCard(null);
            queryClient.invalidateQueries({
              queryKey: ["flashcard-deck", deckId],
            });
          }}
          onCancel={() => {
            setIsCreatingCard(false);
            setEditingCard(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{deck.title}</h2>
          {deck.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {deck.description}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => setIsReviewing(true)}
            disabled={cards.length === 0}
          >
            <Play className="w-4 h-4 mr-2" />
            Study ({cards.length})
          </Button>
          <Button variant="outline" onClick={() => setIsCreatingCard(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Card
          </Button>
          <GenerateFlashcardsDialog
            deckId={deckId}
            onSuccess={() => {
              queryClient.invalidateQueries({
                queryKey: ["flashcard-deck", deckId],
              });
              queryClient.invalidateQueries({
                queryKey: ["flashcard-statistics", deckId],
              });
            }}
          />
        </div>
      </div>

      {/* Statistics */}
      {statistics && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-semibold">Deck Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">{statistics.totalCards}</div>
              <div className="text-xs text-muted-foreground">Total Cards</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-orange-50 dark:bg-orange-950">
              <div className="text-2xl font-bold text-orange-600">
                {statistics.dueCards}
              </div>
              <div className="text-xs text-muted-foreground">Due Now</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
              <div className="text-2xl font-bold text-blue-600">
                {statistics.newCards}
              </div>
              <div className="text-xs text-muted-foreground">New</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950">
              <div className="text-2xl font-bold text-yellow-600">
                {cardCounts.learning}
              </div>
              <div className="text-xs text-muted-foreground">Learning</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
              <div className="text-2xl font-bold text-green-600">
                {statistics.masteredCards}
              </div>
              <div className="text-xs text-muted-foreground">Mastered</div>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <div className="text-2xl font-bold">
                {statistics.averageEaseFactor.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground">Avg Ease</div>
            </div>
          </div>
        </Card>
      )}

      {/* Cards Section */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <h3 className="font-semibold flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            All Cards ({filteredCards.length}
            {filteredCards.length !== cards.length && ` of ${cards.length}`})
          </h3>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48"
              />
            </div>

            {/* Filter by status */}
            <Tabs
              value={filterStatus}
              onValueChange={(v) => setFilterStatus(v as CardStatus | "all")}
            >
              <TabsList className="h-9">
                <TabsTrigger value="all" className="text-xs px-2">
                  All
                </TabsTrigger>
                <TabsTrigger value="new" className="text-xs px-2">
                  <Star className="w-3 h-3 mr-1" />
                  {cardCounts.new}
                </TabsTrigger>
                <TabsTrigger value="due" className="text-xs px-2">
                  <Clock className="w-3 h-3 mr-1" />
                  {cardCounts.due}
                </TabsTrigger>
                <TabsTrigger value="learning" className="text-xs px-2">
                  <Brain className="w-3 h-3 mr-1" />
                  {cardCounts.learning}
                </TabsTrigger>
                <TabsTrigger value="mastered" className="text-xs px-2">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {cardCounts.mastered}
                </TabsTrigger>
                <TabsTrigger value="difficult" className="text-xs px-2">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {cardCounts.difficult}
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* View mode toggle */}
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "secondary" : "ghost"}
                size="sm"
                className="rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cards List */}
        {filteredCards.length === 0 ? (
          <Card className="p-6">
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-2">
                {cards.length === 0
                  ? "No cards in this deck yet"
                  : "No cards match your filter"}
              </p>
              {cards.length === 0 && (
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingCard(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Card
                </Button>
              )}
            </div>
          </Card>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCards.map((card, index) => (
              <Card
                key={card.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => setPreviewCard(card)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        #{index + 1}
                      </span>
                      {getStatusBadge(getCardStatus(card))}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCard(card);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            confirm("Are you sure you want to delete this card?")
                          ) {
                            deleteMutation.mutate(card.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Q:
                      </div>
                      <div className="text-sm font-medium line-clamp-2">
                        {card.front}
                      </div>
                    </div>
                    <div className="border-t pt-2">
                      <div className="text-xs text-muted-foreground mb-1">
                        A:
                      </div>
                      <div className="text-sm line-clamp-2 text-muted-foreground">
                        {card.back}
                      </div>
                    </div>
                  </div>
                  {card.repetitions > 0 && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t">
                      <span>Reviews: {card.repetitions}</span>
                      <span>•</span>
                      <span>Ease: {card.easeFactor.toFixed(1)}</span>
                      {card.nextReviewAt && (
                        <>
                          <span>•</span>
                          <span>
                            Next:{" "}
                            {new Date(card.nextReviewAt).toLocaleDateString()}
                          </span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards.map((card, index) => (
              <Card
                key={card.id}
                className="p-4 hover:bg-muted/50 transition-colors cursor-pointer group"
                onClick={() => setPreviewCard(card)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-xs text-muted-foreground w-8">
                    #{index + 1}
                  </span>
                  {getStatusBadge(getCardStatus(card))}
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div className="truncate">
                      <span className="text-xs text-muted-foreground">Q: </span>
                      {card.front}
                    </div>
                    <div className="truncate text-muted-foreground">
                      <span className="text-xs">A: </span>
                      {card.back}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingCard(card);
                      }}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (
                          confirm("Are you sure you want to delete this card?")
                        ) {
                          deleteMutation.mutate(card.id);
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
        )}
      </div>

      {/* Card Preview Dialog */}
      <Dialog open={!!previewCard} onOpenChange={() => setPreviewCard(null)}>
        <DialogContent className="!max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Card Preview
              {previewCard && getStatusBadge(getCardStatus(previewCard))}
            </DialogTitle>
          </DialogHeader>
          {previewCard && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Question (Front)
                </label>
                <Card className="p-4 bg-muted/30">
                  <p className="text-lg whitespace-pre-wrap">
                    {previewCard.front}
                  </p>
                  {(previewCard as any).frontImageUrl && (
                    <img
                      src={(previewCard as any).frontImageUrl}
                      alt="Front"
                      className="mt-4 max-h-48 rounded-lg"
                    />
                  )}
                </Card>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">
                  Answer (Back)
                </label>
                <Card className="p-4 bg-muted/30">
                  <p className="text-lg whitespace-pre-wrap">
                    {previewCard.back}
                  </p>
                  {(previewCard as any).backImageUrl && (
                    <img
                      src={(previewCard as any).backImageUrl}
                      alt="Back"
                      className="mt-4 max-h-48 rounded-lg"
                    />
                  )}
                </Card>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-muted-foreground">
                  {previewCard.repetitions > 0 ? (
                    <>
                      Reviewed {previewCard.repetitions} times • Ease:{" "}
                      {previewCard.easeFactor.toFixed(2)}
                      {previewCard.nextReviewAt && (
                        <>
                          {" "}
                          • Next review:{" "}
                          {new Date(
                            previewCard.nextReviewAt
                          ).toLocaleDateString()}
                        </>
                      )}
                    </>
                  ) : (
                    "Not yet reviewed"
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setPreviewCard(null);
                      setEditingCard(previewCard);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
