"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDueCards,
  reviewCardAction,
  getDeckById,
} from "@/lib/actions/flashcardActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  RotateCcw,
  X,
  Check,
  Zap,
  BookOpen,
  Clock,
  Search,
  Shuffle,
  ListOrdered,
  Filter,
  Brain,
  Star,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import type { Flashcard } from "@repo/db/client-types";

interface FlashcardReviewProps {
  deckId: number;
  onComplete?: () => void;
}

type ReviewMode = "due" | "all" | "new" | "difficult";
type CardStatus = "new" | "learning" | "due" | "mastered" | "difficult";

function getCardStatus(card: Flashcard): CardStatus {
  if (card.repetitions === 0) return "new";
  if (card.easeFactor < 2.0) return "difficult";
  if (card.nextReviewAt && new Date(card.nextReviewAt) <= new Date())
    return "due";
  if (card.repetitions >= 3 && card.easeFactor >= 2.5) return "mastered";
  return "learning";
}

function getStatusColor(status: CardStatus): string {
  switch (status) {
    case "new":
      return "bg-blue-500";
    case "learning":
      return "bg-yellow-500";
    case "due":
      return "bg-orange-500";
    case "mastered":
      return "bg-green-500";
    case "difficult":
      return "bg-red-500";
    default:
      return "bg-gray-500";
  }
}

function getStatusBadge(status: CardStatus) {
  switch (status) {
    case "new":
      return (
        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
          <Star className="w-3 h-3 mr-1" />
          New
        </Badge>
      );
    case "learning":
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">
          <Brain className="w-3 h-3 mr-1" />
          Learning
        </Badge>
      );
    case "due":
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-700">
          <Clock className="w-3 h-3 mr-1" />
          Due
        </Badge>
      );
    case "mastered":
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-700">
          <Check className="w-3 h-3 mr-1" />
          Mastered
        </Badge>
      );
    case "difficult":
      return (
        <Badge variant="secondary" className="bg-red-100 text-red-700">
          <AlertCircle className="w-3 h-3 mr-1" />
          Difficult
        </Badge>
      );
    default:
      return null;
  }
}

export function FlashcardReview({ deckId, onComplete }: FlashcardReviewProps) {
  const queryClient = useQueryClient();
  const [reviewMode, setReviewMode] = useState<ReviewMode>("all");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isShuffled, setIsShuffled] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  // Fetch all cards from the deck
  const { data: deckData, isLoading: deckLoading } = useQuery({
    queryKey: ["flashcard-deck", deckId],
    queryFn: () => getDeckById(deckId),
  });

  // Fetch due cards
  const { data: dueData } = useQuery({
    queryKey: ["flashcard-due", deckId],
    queryFn: () => getDueCards(deckId, 500), // Get all due cards
  });

  const reviewMutation = useMutation({
    mutationFn: reviewCardAction,
    onSuccess: (result) => {
      if (result.success) {
        setReviewedCount((prev) => prev + 1);
        // Move to next card
        if (currentIndex < filteredCards.length - 1) {
          setCurrentIndex(currentIndex + 1);
          setIsFlipped(false);
          setStartTime(Date.now());
        } else {
          // All cards reviewed
          toast.success("Session complete! Great job! 🎉");
          onComplete?.();
        }
        queryClient.invalidateQueries({ queryKey: ["flashcard-due", deckId] });
        queryClient.invalidateQueries({ queryKey: ["flashcard-deck", deckId] });
        queryClient.invalidateQueries({
          queryKey: ["flashcard-statistics", deckId],
        });
      } else {
        toast.error(result.error || "Failed to save review");
      }
    },
    onError: () => {
      toast.error("Failed to save review");
    },
  });

  const allCards: Flashcard[] = useMemo(() => {
    return ((deckData?.data?.deck as any)?.cards || []) as Flashcard[];
  }, [deckData]);

  const dueCards: Flashcard[] = useMemo(() => {
    return (dueData?.data?.cards || []) as Flashcard[];
  }, [dueData]);

  // Filter cards based on review mode and search
  const filteredCards = useMemo(() => {
    let cards: Flashcard[] = [];

    switch (reviewMode) {
      case "due":
        cards = dueCards;
        break;
      case "new":
        cards = allCards.filter((c) => c.repetitions === 0);
        break;
      case "difficult":
        cards = allCards.filter((c) => c.easeFactor < 2.0);
        break;
      case "all":
      default:
        cards = allCards;
        break;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(
        (c) =>
          c.front.toLowerCase().includes(query) ||
          c.back.toLowerCase().includes(query)
      );
    }

    // Shuffle if enabled
    if (isShuffled) {
      cards = [...cards].sort(() => Math.random() - 0.5);
    }

    return cards;
  }, [allCards, dueCards, reviewMode, searchQuery, isShuffled]);

  // Calculate stats
  const stats = useMemo(() => {
    const newCount = allCards.filter((c) => c.repetitions === 0).length;
    const masteredCount = allCards.filter(
      (c) => c.repetitions >= 3 && c.easeFactor >= 2.5
    ).length;
    const learningCount = allCards.length - newCount - masteredCount;
    const difficultCount = allCards.filter((c) => c.easeFactor < 2.0).length;

    return {
      total: allCards.length,
      new: newCount,
      learning: learningCount,
      mastered: masteredCount,
      due: dueCards.length,
      difficult: difficultCount,
    };
  }, [allCards, dueCards]);

  useEffect(() => {
    if (filteredCards.length > 0 && currentIndex < filteredCards.length) {
      setStartTime(Date.now());
    }
  }, [currentIndex, filteredCards.length]);

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [reviewMode, searchQuery, isShuffled]);

  const handleReview = (quality: number) => {
    if (!filteredCards[currentIndex] || !startTime) return;

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    // Update session stats
    const statKey =
      quality === 1
        ? "again"
        : quality === 2
          ? "hard"
          : quality === 3
            ? "good"
            : "easy";
    setSessionStats((prev) => ({ ...prev, [statKey]: prev[statKey] + 1 }));

    reviewMutation.mutate({
      cardId: filteredCards[currentIndex].id,
      quality,
      timeSpent,
    });
  };

  const handleSkip = () => {
    if (currentIndex < filteredCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setStartTime(Date.now());
    }
  };

  if (deckLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  const currentCard = filteredCards[currentIndex];
  const progress =
    filteredCards.length > 0
      ? ((currentIndex + 1) / filteredCards.length) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <Card className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {stats.due}
            </div>
            <div className="text-xs text-muted-foreground">Due</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
            <div className="text-xs text-muted-foreground">New</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.learning}
            </div>
            <div className="text-xs text-muted-foreground">Learning</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {stats.mastered}
            </div>
            <div className="text-xs text-muted-foreground">Mastered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {stats.difficult}
            </div>
            <div className="text-xs text-muted-foreground">Difficult</div>
          </div>
        </div>
      </Card>

      {/* Review Mode Tabs */}
      <Tabs
        value={reviewMode}
        onValueChange={(v) => setReviewMode(v as ReviewMode)}
      >
        <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <BookOpen className="w-4 h-4" />
              All ({stats.total})
            </TabsTrigger>
            <TabsTrigger value="due" className="gap-2">
              <Clock className="w-4 h-4" />
              Due ({stats.due})
            </TabsTrigger>
            <TabsTrigger value="new" className="gap-2">
              <Star className="w-4 h-4" />
              New ({stats.new})
            </TabsTrigger>
            <TabsTrigger value="difficult" className="gap-2">
              <AlertCircle className="w-4 h-4" />
              Difficult ({stats.difficult})
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-48"
              />
            </div>
            <Button
              variant={isShuffled ? "default" : "outline"}
              size="icon"
              onClick={() => setIsShuffled(!isShuffled)}
              title={isShuffled ? "Shuffled" : "In order"}
            >
              {isShuffled ? (
                <Shuffle className="w-4 h-4" />
              ) : (
                <ListOrdered className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Tabs>

      {/* Session Progress */}
      {reviewedCount > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              This session: {reviewedCount} reviewed
            </span>
            <div className="flex gap-4 text-xs">
              <span className="text-red-600">Again: {sessionStats.again}</span>
              <span className="text-orange-600">
                Hard: {sessionStats.hard}
              </span>
              <span className="text-green-600">Good: {sessionStats.good}</span>
              <span className="text-blue-600">Easy: {sessionStats.easy}</span>
            </div>
          </div>
        </Card>
      )}

      {filteredCards.length === 0 ? (
        <Card className="p-6">
          <div className="text-center py-8">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              {reviewMode === "due"
                ? "No cards due for review"
                : reviewMode === "new"
                  ? "No new cards"
                  : reviewMode === "difficult"
                    ? "No difficult cards"
                    : "No cards found"}
            </p>
            <p className="text-xs text-muted-foreground">
              {reviewMode === "due"
                ? "All caught up! Check back later for more reviews."
                : "Try a different filter or add more cards."}
            </p>
          </div>
        </Card>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Card {currentIndex + 1} of {filteredCards.length}
              </span>
              <span className="text-muted-foreground">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Card Status Indicator */}
          {currentCard && (
            <div className="flex items-center justify-between">
              {getStatusBadge(getCardStatus(currentCard))}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {currentCard.repetitions > 0 && (
                  <span>Reviews: {currentCard.repetitions}</span>
                )}
                {currentCard.easeFactor && (
                  <span>Ease: {currentCard.easeFactor.toFixed(1)}</span>
                )}
              </div>
            </div>
          )}

          {/* Flashcard */}
          <AnimatePresence mode="wait">
            {currentCard && (
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className="p-8 min-h-[350px] flex items-center justify-center relative cursor-pointer"
                  onClick={() => !isFlipped && setIsFlipped(true)}
                >
                  <div className="w-full text-center space-y-4">
                    {!isFlipped ? (
                      <motion.div
                        initial={{ rotateY: 0 }}
                        animate={{ rotateY: 0 }}
                        className="space-y-4"
                      >
                        <Badge variant="outline" className="mb-4">
                          Question
                        </Badge>
                        <div className="text-2xl font-medium leading-relaxed whitespace-pre-wrap">
                          {currentCard.front || "No front text"}
                        </div>
                        {(currentCard as any).frontImageUrl && (
                          <img
                            src={(currentCard as any).frontImageUrl}
                            alt="Front"
                            className="max-w-full max-h-48 mx-auto rounded-lg mt-4"
                          />
                        )}
                        <p className="text-xs text-muted-foreground mt-4">
                          Click or press Space to reveal answer
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-4"
                      >
                        <Badge variant="default" className="mb-4">
                          Answer
                        </Badge>
                        <div className="text-xl leading-relaxed whitespace-pre-wrap">
                          {currentCard.back || "No back text"}
                        </div>
                        {(currentCard as any).backImageUrl && (
                          <img
                            src={(currentCard as any).backImageUrl}
                            alt="Back"
                            className="max-w-full max-h-48 mx-auto rounded-lg mt-4"
                          />
                        )}
                      </motion.div>
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation & Review Buttons */}
          {!isFlipped ? (
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                ← Previous
              </Button>
              <Button variant="default" onClick={() => setIsFlipped(true)}>
                Show Answer
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={currentIndex >= filteredCards.length - 1}
              >
                Skip →
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <p className="text-center text-sm text-muted-foreground">
                How well did you know this?
              </p>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  variant="destructive"
                  className="flex flex-col items-center gap-1 h-auto py-4"
                  onClick={() => handleReview(1)}
                  disabled={reviewMutation.isPending}
                >
                  <RotateCcw className="w-5 h-5" />
                  <span className="text-xs">Again</span>
                  <span className="text-[10px] opacity-70">&lt;1 min</span>
                </Button>
                <Button
                  variant="secondary"
                  className="flex flex-col items-center gap-1 h-auto py-4 bg-orange-100 hover:bg-orange-200 text-orange-700"
                  onClick={() => handleReview(2)}
                  disabled={reviewMutation.isPending}
                >
                  <X className="w-5 h-5" />
                  <span className="text-xs">Hard</span>
                  <span className="text-[10px] opacity-70">~10 min</span>
                </Button>
                <Button
                  variant="default"
                  className="flex flex-col items-center gap-1 h-auto py-4 bg-green-600 hover:bg-green-700"
                  onClick={() => handleReview(3)}
                  disabled={reviewMutation.isPending}
                >
                  <Check className="w-5 h-5" />
                  <span className="text-xs">Good</span>
                  <span className="text-[10px] opacity-70">~1 day</span>
                </Button>
                <Button
                  variant="outline"
                  className="flex flex-col items-center gap-1 h-auto py-4 bg-blue-100 hover:bg-blue-200 text-blue-700"
                  onClick={() => handleReview(4)}
                  disabled={reviewMutation.isPending}
                >
                  <Zap className="w-5 h-5" />
                  <span className="text-xs">Easy</span>
                  <span className="text-[10px] opacity-70">~4 days</span>
                </Button>
              </div>
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(false)}
                >
                  Hide Answer
                </Button>
              </div>
            </motion.div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="text-center text-xs text-muted-foreground">
            Tip: Press 1-4 to rate, Space to flip, ← → to navigate
          </div>
        </>
      )}
    </div>
  );
}
