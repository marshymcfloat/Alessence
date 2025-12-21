"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createGoalSchema, CreateGoalTypes } from "@repo/types";
import { createGoalAction } from "@/lib/actions/goalActions";
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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Target, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import type { Subject } from "@repo/db";

interface GoalFormProps {
  onSuccess?: () => void;
}

export default function GoalForm({ onSuccess }: GoalFormProps) {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: subjectsData } = useQuery({
    queryKey: ["subjects"],
    queryFn: getEnrolledSubject,
  });

  const subjects: Subject[] = subjectsData?.data?.subjects || [];

  const form = useForm<CreateGoalTypes>({
    resolver: zodResolver(createGoalSchema),
    defaultValues: {
      periodType: "DAILY",
      targetMinutes: 120, // 2 hours default
      subjectId: null,
    },
  });

  const onSubmit = async (values: CreateGoalTypes) => {
    setIsSubmitting(true);
    try {
      const result = await createGoalAction(values);
      if (result.success) {
        toast.success(result.message || "Goal created successfully!");
        queryClient.invalidateQueries({ queryKey: ["goals"] });
        queryClient.invalidateQueries({ queryKey: ["goals-progress"] });
        form.reset();
        onSuccess?.();
      } else {
        toast.error(result.error || "Failed to create goal");
      }
    } catch (error) {
      console.error("Error creating goal:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const periodType = form.watch("periodType");

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="periodType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold flex items-center gap-2">
                <Target className="w-4 h-4" />
                Goal Period
              </FormLabel>
              <FormDescription className="text-xs">
                Choose whether this is a daily or weekly study goal
              </FormDescription>
              <FormControl>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <SelectTrigger className="!h-11">
                    <SelectValue placeholder="Select period type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily Goal</SelectItem>
                    <SelectItem value="WEEKLY">Weekly Goal</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="targetMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-semibold">
                Target Time ({periodType === "DAILY" ? "per day" : "per week"})
              </FormLabel>
              <FormDescription className="text-xs">
                Set your target study time in minutes
              </FormDescription>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="120"
                    className="!h-11"
                    {...field}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                  <Select
                    onValueChange={(value) => {
                      const hours = Number(value);
                      field.onChange(hours * 60);
                    }}
                    value={String(Math.floor((field.value || 0) / 60))}
                  >
                    <SelectTrigger className="w-24 !h-11">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24].map((h) => (
                        <SelectItem key={h} value={String(h)}>
                          {h}h
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Current target: {Math.floor((field.value || 0) / 60)}h{" "}
                {(field.value || 0) % 60}m
              </FormDescription>
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
                Link this goal to a specific subject, or leave empty for overall
                study time
              </FormDescription>
              <FormControl>
                <Select
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? null : Number(value))
                  }
                  value={field.value ? String(field.value) : "none"}
                >
                  <SelectTrigger className="!h-11">
                    <SelectValue placeholder="All subjects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">All Subjects</SelectItem>
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
            "Creating..."
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Create Goal
            </>
          )}
        </Button>
      </form>
    </Form>
  );
}

