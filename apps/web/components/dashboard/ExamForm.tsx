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
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 lg:space-y-8"
      >
        {/* Two Column Layout on Large Screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="subjectId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Subject
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value ? String(field.value) : ""}
                    disabled={isLoadingSubjects}
                  >
                    <FormControl>
                      <SelectTrigger className="!h-11">
                        <SelectValue
                          placeholder={
                            isLoadingSubjects
                              ? "Loading..."
                              : "Select a subject"
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
              name="items"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    Number of Items
                  </FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={String(field.value)}
                  >
                    <FormControl>
                      <SelectTrigger className="!h-11">
                        <SelectValue placeholder="Select exam items" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="5">5 items</SelectItem>
                      <SelectItem value="10">10 items</SelectItem>
                      <SelectItem value="25">25 items</SelectItem>
                      <SelectItem value="50">50 items</SelectItem>
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
                    <FormLabel className="text-sm font-semibold">
                      Question Types
                    </FormLabel>
                    <FormDescription className="text-xs">
                      Select one or more question types
                    </FormDescription>
                  </div>
                  <div className="space-y-3">
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
                                className="flex flex-row items-center space-x-3 space-y-0 rounded-lg border p-3 hover:bg-accent/50 transition-colors"
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
                                <FormLabel className="font-normal capitalize cursor-pointer flex-1">
                                  {item.replace("_", " ").toLowerCase()}
                                </FormLabel>
                              </FormItem>
                            );
                          }}
                        />
                      )
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="files"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-semibold">
                    File Reviewer(s)
                  </FormLabel>
                  <FormDescription className="text-xs mb-3">
                    Upload files to use as reference material for the exam
                  </FormDescription>
                  <FormControl>
                    <div className="!min-h-[200px]">
                      <UploadFiles
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="describe"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel className="text-sm font-semibold">
                    Instructions or Description
                  </FormLabel>
                  <FormDescription className="text-xs mb-2">
                    Provide specific instructions or describe what the exam
                    should cover
                  </FormDescription>
                  <FormControl>
                    <Textarea
                      placeholder="e.g., This exam will cover chapters 1-5 focusing on basic concepts and principles..."
                      {...field}
                      className="!min-h-[120px] resize-none"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Submit Button - Full Width */}
        <div className="pt-4 border-t">
          <Button
            type="submit"
            className="w-full !h-11 text-base font-semibold"
            disabled={mutation.isPending}
          >
            {mutation.isPending && (
              <LoaderCircle className="mr-2 h-5 w-5 animate-spin" />
            )}
            {mutation.isPending ? "Generating Exam..." : "Create Exam"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
