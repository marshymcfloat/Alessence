"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createFlashcardDeckSchema,
  CreateFlashcardDeckTypes,
  UpdateFlashcardDeckTypes,
} from "@repo/types";
import { createDeckAction, updateDeckAction } from "@/lib/actions/flashcardActions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Plus, Save } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import type { Subject } from "@repo/db";
import type { FlashcardDeck } from "@repo/db/client-types";

interface FlashcardDeckFormProps {
  deck?: FlashcardDeck & { subject?: { id: number; title: string } | null };
  onSuccess?: () => void;
}

export default function FlashcardDeckForm({
  deck,
  onSuccess,
}: FlashcardDeckFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: getEnrolledSubject,
  });

  const subjects: Subject[] = subjectsData?.data?.subjects || [];

  const form = useForm<CreateFlashcardDeckTypes>({
    resolver: zodResolver(createFlashcardDeckSchema),
    defaultValues: {
      title: deck?.title || "",
      description: deck?.description || "",
      subjectId: deck?.subject?.id || null,
    },
  });

  const onSubmit = async (values: CreateFlashcardDeckTypes) => {
    setIsSubmitting(true);
    try {
      let result;
      if (deck) {
        result = await updateDeckAction(deck.id, values as UpdateFlashcardDeckTypes);
      } else {
        result = await createDeckAction(values);
      }

      if (result.success) {
        toast.success(result.message || "Deck saved successfully!");
        queryClient.invalidateQueries({ queryKey: ["flashcard-decks"] });
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to save deck");
      }
    } catch (error) {
      console.error("Error saving deck:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Deck Title
              </FormLabel>
              <FormDescription className="text-xs">
                Give your flashcard deck a descriptive name
              </FormDescription>
              <FormControl>
                <Input
                  placeholder="e.g., Accounting Fundamentals"
                  className="!h-11"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Description (Optional)
              </FormLabel>
              <FormDescription className="text-xs">
                Add a brief description of what this deck covers
              </FormDescription>
              <FormControl>
                <Textarea
                  placeholder="e.g., Key concepts and definitions for accounting basics"
                  className="min-h-[100px]"
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Subject (Optional)
              </FormLabel>
              <FormDescription className="text-xs">
                Link this deck to a specific subject
              </FormDescription>
              <FormControl>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : Number(value))
                  }
                  value={field.value ? String(field.value) : "none"}
                >
                  <SelectTrigger className="!h-11">
                    <SelectValue placeholder="No subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Subject</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={String(subject.id)}>
                        {subject.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full !h-11"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            "Saving..."
          ) : deck ? (
            <>
              <Save className="w-4 h-4 mr-2" />
              Update Deck
            </>
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Deck
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

