"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getAllFiles } from "@/lib/actions/fileActionts";
import {
  generateFlashcardsFromFiles,
  createCardAction,
} from "@/lib/actions/flashcardActions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { File } from "@repo/db/client-types";

interface GenerateFlashcardsDialogProps {
  deckId: number;
  onSuccess?: () => void;
}

export function GenerateFlashcardsDialog({
  deckId,
  onSuccess,
}: GenerateFlashcardsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [cardCount, setCardCount] = useState(10);
  const [generatedCards, setGeneratedCards] = useState<
    Array<{ front: string; back: string }>
  >([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: filesData, isLoading: filesLoading } = useQuery({
    queryKey: ["files"],
    queryFn: getAllFiles,
    enabled: isOpen,
  });

  const generateMutation = useMutation({
    mutationFn: () => generateFlashcardsFromFiles(selectedFileIds, cardCount),
    onSuccess: (result) => {
      if (result.success && result.data) {
        setGeneratedCards(result.data.cards);
        toast.success(`Generated ${result.data.cards.length} flashcards!`);
      } else {
        toast.error(result.error || "Failed to generate flashcards");
      }
      setIsGenerating(false);
    },
    onError: () => {
      toast.error("Failed to generate flashcards");
      setIsGenerating(false);
    },
  });

  const saveCardsMutation = useMutation({
    mutationFn: async (cards: Array<{ front: string; back: string }>) => {
      const results = await Promise.all(
        cards.map((card) =>
          createCardAction({
            front: card.front,
            back: card.back,
            deckId,
            frontImageUrl: null,
            backImageUrl: null,
          })
        )
      );
      return results;
    },
    onSuccess: () => {
      toast.success("All flashcards saved successfully!");
      setIsOpen(false);
      setGeneratedCards([]);
      setSelectedFileIds([]);
      onSuccess?.();
    },
    onError: () => {
      toast.error("Failed to save some flashcards");
    },
  });

  const files: File[] = filesData?.data?.files || [];

  const handleFileToggle = (fileId: number) => {
    setSelectedFileIds((prev) =>
      prev.includes(fileId)
        ? prev.filter((id) => id !== fileId)
        : [...prev, fileId]
    );
  };

  const handleGenerate = () => {
    if (selectedFileIds.length === 0) {
      toast.error("Please select at least one file");
      return;
    }
    if (cardCount < 1 || cardCount > 50) {
      toast.error("Card count must be between 1 and 50");
      return;
    }
    setIsGenerating(true);
    generateMutation.mutate();
  };

  const handleSaveAll = () => {
    if (generatedCards.length === 0) return;
    saveCardsMutation.mutate(generatedCards);
  };

  const handleCardEdit = (
    index: number,
    field: "front" | "back",
    value: string
  ) => {
    setGeneratedCards((prev) =>
      prev.map((card, i) => (i === index ? { ...card, [field]: value } : card))
    );
  };

  const handleRemoveCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Sparkles className="w-4 h-4" />
          Generate from Files
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-5xl !w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Generate Flashcards from Files</DialogTitle>
          <DialogDescription>
            Select files and let AI generate flashcards for you. You can edit
            them before saving.
          </DialogDescription>
        </DialogHeader>

        {generatedCards.length === 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* File Selection */}
              <div className="space-y-4">
                <Label>Select Files ({selectedFileIds.length} selected)</Label>
                {filesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : files.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No files available. Upload files first.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto border rounded-lg p-4">
                    {files.map((file) => (
                      <div
                        key={file.id}
                        className="flex items-center space-x-2 p-2 hover:bg-muted rounded"
                      >
                        <Checkbox
                          checked={selectedFileIds.includes(file.id)}
                          onCheckedChange={() => handleFileToggle(file.id)}
                        />
                        <Label className="flex-1 cursor-pointer truncate">
                          {file.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Options Column */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardCount">
                    Number of Cards to Generate (1-50)
                  </Label>
                  <Input
                    id="cardCount"
                    type="number"
                    min={1}
                    max={50}
                    value={cardCount}
                    onChange={(e) => setCardCount(Number(e.target.value))}
                  />
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                  <p className="text-sm font-medium">AI Generation Tips:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• Select files with clear, structured content</li>
                    <li>• PDFs and text documents work best</li>
                    <li>• You can edit all cards before saving</li>
                    <li>• More cards = longer generation time</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || selectedFileIds.length === 0}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Flashcards
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Review and edit the generated flashcards (
                {generatedCards.length} cards)
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setGeneratedCards([]);
                    setSelectedFileIds([]);
                  }}
                >
                  Start Over
                </Button>
                <Button
                  onClick={handleSaveAll}
                  disabled={saveCardsMutation.isPending}
                >
                  {saveCardsMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Save All Cards
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Generated Cards List */}
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {generatedCards.map((card, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs text-muted-foreground">
                      Card {index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCard(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs">Front (Question)</Label>
                      <Textarea
                        value={card.front}
                        onChange={(e) =>
                          handleCardEdit(index, "front", e.target.value)
                        }
                        className="min-h-[100px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Back (Answer)</Label>
                      <Textarea
                        value={card.back}
                        onChange={(e) =>
                          handleCardEdit(index, "back", e.target.value)
                        }
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
