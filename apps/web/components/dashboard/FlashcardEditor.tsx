"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFlashcardSchema,
  CreateFlashcardTypes,
  UpdateFlashcardTypes,
} from "@repo/types";
import { createCardAction, updateCardAction } from "@/lib/actions/flashcardActions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Plus, X } from "lucide-react";
import type { Flashcard } from "@repo/db/client-types";

interface FlashcardEditorProps {
  deckId: number;
  card?: Flashcard;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function FlashcardEditor({
  deckId,
  card,
  onSuccess,
  onCancel,
}: FlashcardEditorProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateFlashcardTypes>({
    resolver: zodResolver(createFlashcardSchema),
    defaultValues: {
      front: card?.front || "",
      back: card?.back || "",
      frontImageUrl: card?.frontImageUrl || "",
      backImageUrl: card?.backImageUrl || "",
      deckId,
    },
  });

  const onSubmit = async (values: CreateFlashcardTypes) => {
    setIsSubmitting(true);
    try {
      let result;
      if (card) {
        result = await updateCardAction(card.id, values as UpdateFlashcardTypes);
      } else {
        result = await createCardAction(values);
      }

      if (result.success) {
        toast.success(result.message || "Card saved successfully!");
        queryClient.invalidateQueries({ queryKey: ["flashcard-cards"] });
        queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to save card");
      }
    } catch (error) {
      console.error("Error saving card:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Front Side */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Front (Question)</h3>
            <FormField
              control={form.control}
              name="front"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the question or prompt..."
                      className="min-h-[200px] font-medium"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frontImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      type="url"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Back Side */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold">Back (Answer)</h3>
            <FormField
              control={form.control}
              name="back"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Enter the answer or explanation..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="backImageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Image URL (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://..."
                      type="url"
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            type="submit"
            className="flex-1 !h-11"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              "Saving..."
            ) : card ? (
              <>
                <Save className="w-4 h-4 mr-2" />
                Update Card
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Card
              </>
            )}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              className="!h-11"
              onClick={onCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
}

