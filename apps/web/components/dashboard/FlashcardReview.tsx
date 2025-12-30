"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDueCards,
  reviewCardAction,
  getDeckById,
} from "@/lib/actions/flashcardActions";
import { Card, CardContent } from "@/components/ui/card";
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
          <div className="relative h-[400px] w-full max-w-2xl mx-auto perspective-1000 group">
            <motion.div
              className="w-full h-full relative preserve-3d transition-all"
              initial={false}
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.4, type: "tween", ease: "easeInOut" }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front Face */}
              <Card 
                className="absolute inset-0 backface-hidden w-full h-full flex flex-col justify-between border-2 hover:border-purple-300 dark:hover:border-purple-700 transition-colors bg-white dark:bg-slate-950 cursor-pointer"
                onClick={() => !isFlipped && setIsFlipped(true)}
              >
                <div className="absolute top-4 right-4 z-10">
                  {currentCard ? getStatusBadge(getCardStatus(currentCard)) : null}
                </div>
                
                <CardContent className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <Badge variant="outline" className="mb-6 uppercase tracking-widest text-xs">
                    Question
                  </Badge>
                  
                  <div className="text-xl font-bold text-slate-800 dark:text-slate-100 leading-snug max-w-2xl mx-auto">
                    {currentCard?.front || "No front text"}
                  </div>
                  
                  {currentCard && (currentCard as any).frontImageUrl && (
                    <img
                      src={(currentCard as any).frontImageUrl}
                      alt="Front"
                      className="max-w-full max-h-48 mx-auto rounded-lg mt-6 shadow-sm"
                    />
                  )}
                </CardContent>
                
                <div className="p-4 text-center border-t bg-slate-50 dark:bg-slate-900/50">
                  <span className="text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <RotateCcw className="w-3 h-3" /> Click or press Space to flip
                  </span>
                </div>
              </Card>

              {/* Back Face */}
              <Card 
                className="absolute inset-0 backface-hidden w-full h-full flex flex-col border-2 border-purple-200 dark:border-purple-800 bg-purple-50/10 dark:bg-slate-900 cursor-pointer"
                style={{ transform: "rotateY(180deg)" }}
                onClick={() => setIsFlipped(false)}
              >
                <div className="absolute top-4 right-4 z-10 opacity-50">
                   {currentCard ? getStatusBadge(getCardStatus(currentCard)) : null}
                </div>

                <CardContent className="flex flex-col h-full p-8 overflow-y-auto">
                   <div className="flex justify-center shrink-0 mb-6">
                    <Badge variant="default" className="bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/50 dark:text-purple-300 uppercase tracking-widest text-xs border-purple-200">
                      Answer
                    </Badge>
                   </div>
                   
                  <div className="text-lg text-slate-700 dark:text-slate-300 leading-relaxed text-center grow flex flex-col justify-center">
                    <div className="whitespace-pre-wrap">
                      {currentCard?.back || "No back text"}
                    </div>
                    
                    {currentCard && (currentCard as any).backImageUrl && (
                      <img
                        src={(currentCard as any).backImageUrl}
                        alt="Back"
                        className="max-w-full max-h-48 mx-auto rounded-lg mt-6 shadow-sm"
                      />
                    )}
                  </div>
                </CardContent>
                
                <div className="p-4 text-center border-t bg-purple-100/20 dark:bg-purple-900/20 shrink-0">
                   <span className="text-xs text-purple-600/70 dark:text-purple-400/70 font-medium">
                     Select a rating below to continue
                  </span>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Navigation & Review Buttons */}
          {!isFlipped ? (
            <div className="flex justify-between max-w-2xl mx-auto px-1">
              <Button
                variant="ghost"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className="text-muted-foreground hover:text-foreground"
              >
                ← Previous
              </Button>
              <Button 
                onClick={() => setIsFlipped(true)}
                className="bg-primary text-primary-foreground hover:bg-primary/90 min-w-32 shadow-sm"
              >
                Show Answer
              </Button>
              <Button
                variant="ghost"
                onClick={handleSkip}
                disabled={currentIndex >= filteredCards.length - 1}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip →
              </Button>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4 max-w-2xl mx-auto"
            >
              <p className="text-center text-sm text-muted-foreground font-medium">
                How well did you know this?
              </p>
              <div className="flex justify-center gap-3">
                <Button
                  variant="destructive"
                  className="flex flex-col gap-0.5 h-14 w-24"
                  onClick={() => handleReview(1)}
                  disabled={reviewMutation.isPending}
                >
                  <span className="font-semibold">Again</span>
                  <span className="text-[10px] opacity-80 font-normal">&lt;1 min</span>
                </Button>
                <Button
                  className="flex flex-col gap-0.5 h-14 w-24 bg-orange-100 hover:bg-orange-200 text-orange-700 border-orange-200"
                  variant="outline"
                  onClick={() => handleReview(2)}
                  disabled={reviewMutation.isPending}
                >
                  <span className="font-semibold">Hard</span>
                  <span className="text-[10px] opacity-80 font-normal">~10 min</span>
                </Button>
                <Button
                  className="flex flex-col gap-0.5 h-14 w-24 bg-green-100 hover:bg-green-200 text-green-700 border-green-200"
                  variant="outline"
                  onClick={() => handleReview(3)}
                  disabled={reviewMutation.isPending}
                >
                  <span className="font-semibold">Good</span>
                  <span className="text-[10px] opacity-80 font-normal">~1 day</span>
                </Button>
                <Button
                  className="flex flex-col gap-0.5 h-14 w-24 bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-200"
                  variant="outline"
                  onClick={() => handleReview(4)}
                  disabled={reviewMutation.isPending}
                >
                  <span className="font-semibold">Easy</span>
                  <span className="text-[10px] opacity-80 font-normal">~4 days</span>
                </Button>
              </div>
              <div className="flex justify-center pt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsFlipped(false)}
                  className="text-muted-foreground hover:text-foreground"
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
