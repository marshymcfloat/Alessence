"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, CreateTaskTypes } from "@repo/types";
import React from "react";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Calendar } from "../ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { format } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger } from "../ui/select";
import { SelectValue } from "@radix-ui/react-select";
import SubjectSelectInput from "./SubjectSelectInput";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createTaskAction,
  updateTaskAction,
  updateTaskStatus,
} from "@/lib/actions/taskActionts";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { queryClient } from "../providers/TanstackProvider";
import { Task } from "@repo/db";

const AddTaskForm = ({
  onClose,
  initialData,
}: {
  onClose: () => void;
  initialData?: Task | null;
}) => {
  const queryClient = useQueryClient();
  const isEditMode = !!initialData;

  const form = useForm<CreateTaskTypes>({
    resolver: zodResolver(createTaskSchema),
    mode: "onChange",
    defaultValues: {
      title: initialData?.title ?? "",
      description: initialData?.description ?? "",
      deadline: initialData?.deadline
        ? new Date(initialData.deadline)
        : new Date(),
      status: initialData?.status ?? "PLANNED",
      subject: initialData?.subjectId ?? undefined,
    },
  });

  const { mutate: createMutate, isPending: isCreating } = useMutation({
    mutationFn: createTaskAction,
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error || "Failed to create the task.");
        return;
      }
      toast.success(data.message || "Task created successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      form.reset();
      onClose();
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const { mutate: updateMutate, isPending: isUpdating } = useMutation({
    mutationFn: (values: CreateTaskTypes) => {
      if (!initialData?.id) {
        throw new Error("Task ID is missing for update.");
      }
      return updateTaskAction(initialData.id, values);
    },
    onSuccess: (data) => {
      if (!data.success) {
        toast.error(data.error || "Failed to update the task.");
        return;
      }
      toast.success(data.message || "Task updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      onClose();
    },
    onError: (error) => {
      toast.error(
        error.message || "An unexpected error occurred. Please try again."
      );
    },
  });

  const isPending = isCreating || isUpdating;
  const disabled =
    !form.formState.isValid || !form.formState.isDirty || isPending;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function handleSubmission(values: CreateTaskTypes) {
    if (isEditMode) {
      updateMutate(values);
    } else {
      createMutate(values);
    }
  }

  return (
    <Form {...form}>
      <form
        action=""
        onSubmit={form.handleSubmit(handleSubmission)}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="subject"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject *optional*</FormLabel>
              <FormControl>
                <SubjectSelectInput
                  onValueChange={field.onChange}
                  value={field.value}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between">
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deadline</FormLabel>
                <FormControl>
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button variant={"outline"} className="lg:w-[140px]">
                            {field.value ? (
                              format(field.value, "PP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent>
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < today}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </FormControl>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="lg:w-[140px]">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PLANNED">Planned</SelectItem>
                    <SelectItem value="ON_PROGRESS">On progress</SelectItem>
                    <SelectItem value="DONE">Done</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button disabled={disabled || isPending}>
            {isPending ? (
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
            ) : null}
            <span>Create task</span>
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddTaskForm;
