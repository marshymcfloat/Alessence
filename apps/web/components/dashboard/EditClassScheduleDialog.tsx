"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateClassSchedule } from "@/lib/actions/scheduleActions";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";

const formSchema = z.object({
  room: z.string().optional(),
  instructor: z.string().optional(),
});

type EditClassScheduleDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  scheduleId: number;
  initialRoom?: string | null;
  initialInstructor?: string | null;
  subjectName: string;
};

// Define the type for the optimistic update context
type ClassScheduleContext = {
  previousSchedule: unknown;
};

type ScheduleItem = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
  type: string;
  subject: {
    title: string;
  } | null;
};

export function EditClassScheduleDialog({
  isOpen,
  onClose,
  scheduleId,
  initialRoom,
  initialInstructor,
  subjectName,
}: EditClassScheduleDialogProps) {
  const queryClient = useQueryClient();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      room: initialRoom || "",
      instructor: initialInstructor || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      return await updateClassSchedule(
        scheduleId,
        values.room || null,
        values.instructor || null
      );
    },
    onMutate: async (newSchedule) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["classSchedule"] });

      // Snapshot the previous value
      const previousSchedule = queryClient.getQueryData(["classSchedule"]);

      // Optimistically update to the new value
      queryClient.setQueryData<ScheduleItem[]>(["classSchedule"], (old) => {
        if (!old) return [];
        return old.map((item) =>
          item.id === scheduleId
            ? {
                ...item,
                room: newSchedule.room || null,
                instructor: newSchedule.instructor || null,
              }
            : item
        );
      });

      // Close the dialog immediately
      onClose();

      // Return a context object with the snapshotted value
      return { previousSchedule };
    },
    onError: (err, newSchedule, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousSchedule) {
        queryClient.setQueryData(["classSchedule"], context.previousSchedule);
      }
      toast.error("Failed to update schedule");
    },
    onSettled: () => {
      // Always refetch after error or success:
      queryClient.invalidateQueries({ queryKey: ["classSchedule"] });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Schedule updated successfully");
      } else {
        // If the server explicitly returns an error success: false,
        // we might want to consider rolling back or showing an error.
        // Since we closed the dialog, a toast is essential here.
        toast.error(result.error || "Failed to update schedule");
        // Refetching happens in onSettled, which will correct the UI if it was wrong
      }
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Schedule Details</DialogTitle>
          <DialogDescription>
            Update the room and instructor for {subjectName}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="room"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Room / Location</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Room 301, Library" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="instructor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructor</FormLabel>
                  <FormControl>
                    <Input placeholder="Instructor name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
