"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createNewSummarySchema, CreateNewSummaryTypes } from "@repo/types";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "../ui/form";
import UploadFiles from "./UploadFiles";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Textarea } from "../ui/textarea";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { createSummary } from "@/lib/actions/summaryActions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "../providers/TanstackProvider";
import { Subject } from "@repo/db";
import { LoaderCircle } from "lucide-react";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";

type SummaryFormProps = {
  onSuccess?: () => void;
};

export default function SummaryForm({ onSuccess }: SummaryFormProps) {
  const form = useForm<CreateNewSummaryTypes>({
    resolver: zodResolver(createNewSummarySchema),
    defaultValues: {
      files: [],
      title: "",
      description: "",
      subjectId: undefined,
      template: "COMPREHENSIVE",
    },
  });

  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getEnrolledSubject,
  });

  const mutation = useMutation({
    mutationFn: createSummary,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Summary created successfully!");
        queryClient.invalidateQueries({ queryKey: ["summaries"] });
        onSuccess?.();
        form.reset();
      } else {
        toast.error(data.error || "Something went wrong.");
      }
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  function onSubmit(values: CreateNewSummaryTypes) {
    mutation.mutate(values);
  }
  const subjects = subjectsData?.data?.subjects || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="e.g., Financial Accounting Chapter 1 Summary"
                  {...field}
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
              <FormLabel>Subject (Optional)</FormLabel>
              <Select
                onValueChange={(value) =>
                  field.onChange(value === "none" ? undefined : Number(value))
                }
                value={field.value ? String(field.value) : "none"}
                disabled={isLoadingSubjects}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingSubjects
                          ? "Loading..."
                          : "Select a subject (optional)"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {subjects.map((subject: Subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="files"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Documents to Summarize</FormLabel>
              <FormControl>
                <UploadFiles value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="template"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary Format</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select summary format" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="COMPREHENSIVE">
                    Comprehensive Summary
                  </SelectItem>
                  <SelectItem value="KEY_POINTS">Key Points Only</SelectItem>
                  <SelectItem value="CHAPTER_SUMMARY">
                    Chapter Summary Format
                  </SelectItem>
                  <SelectItem value="CONCEPT_MAP">Concept Map Style</SelectItem>
                  <SelectItem value="CUSTOM">Custom Format</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                Choose a format that best suits your study needs. Comprehensive
                includes all details, while Key Points focuses on main concepts.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Summary Focus / Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., Focus on accounting principles, financial statements, and key formulas. Include examples and practical applications relevant to accountancy students."
                  {...field}
                  rows={4}
                />
              </FormControl>
              <FormDescription>
                Describe what aspects of the document you want the summary to
                focus on. This helps the AI generate a more targeted summary for
                accountancy students.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          {mutation.isPending ? "Generating Summary..." : "Create Summary"}
        </Button>
      </form>
    </Form>
  );
}
