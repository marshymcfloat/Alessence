"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createNewExamSchema, CreateNewExamTypes } from "@repo/types";
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
import { Button } from "../ui/button";
import { Checkbox } from "../ui/checkbox";
import { createExam } from "@/lib/actions/examActionts";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { queryClient } from "../providers/TanstackProvider";
import { Subject } from "@repo/db";
import { LoaderCircle } from "lucide-react";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";

type ExamFormProps = {
  onSuccess?: () => void;
};

export default function ExamForm({ onSuccess }: ExamFormProps) {
  const form = useForm<CreateNewExamTypes>({
    resolver: zodResolver(createNewExamSchema),
    defaultValues: {
      files: [],
      items: 10,
      describe: "",
      subjectId: undefined,
      questionTypes: ["MULTIPLE_CHOICE"],
    },
  });

  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getEnrolledSubject,
  });

  const mutation = useMutation({
    mutationFn: createExam,
    onSuccess: (data) => {
      if (data.success) {
        toast.success(data.message || "Exam created successfully!");
        queryClient.invalidateQueries({ queryKey: ["exams"] });
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

  function onSubmit(values: CreateNewExamTypes) {
    mutation.mutate(values);
  }
  const subjects = subjectsData?.data?.subjects || [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="subjectId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value ? String(field.value) : ""}
                disabled={isLoadingSubjects}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isLoadingSubjects ? "Loading..." : "Select a subject"
                      }
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
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
              <FormLabel>File Reviewer(s)</FormLabel>
              <FormControl>
                <UploadFiles value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="items"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Exam Items</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={String(field.value)}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select exam items" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="questionTypes"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">Question Types</FormLabel>
                <FormDescription>
                  Select one or more question types for this exam
                </FormDescription>
              </div>
              {["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION"].map(
                (item) => (
                  <FormField
                    key={item}
                    control={form.control}
                    name="questionTypes"
                    render={({ field }) => {
                      return (
                        <FormItem
                          key={item}
                          className="flex flex-row items-start space-x-3 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(
                                item as
                                  | "MULTIPLE_CHOICE"
                                  | "TRUE_FALSE"
                                  | "IDENTIFICATION"
                              )}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, item])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== item
                                      )
                                    );
                              }}
                            />
                          </FormControl>
                          <FormLabel className="font-normal capitalize">
                            {item.replace("_", " ").toLowerCase()}
                          </FormLabel>
                        </FormItem>
                      );
                    }}
                  />
                )
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="describe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions or Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="e.g., This exam will cover chapters 1-5..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={mutation.isPending}>
          {mutation.isPending && (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          )}
          {mutation.isPending ? "Generating..." : "Create Exam"}
        </Button>
      </form>
    </Form>
  );
}
