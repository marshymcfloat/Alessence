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
import { useQueryClient } from "@tanstack/react-query";

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

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const result = await updateClassSchedule(
        scheduleId,
        values.room || null,
        values.instructor || null
      );

      if (result.success) {
        toast.success("Schedule updated successfully");
        queryClient.invalidateQueries({ queryKey: ["classSchedule"] });
        onClose();
      } else {
        toast.error(result.error || "Failed to update schedule");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
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
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

