import { zodResolver } from "@hookform/resolvers/zod";
import { createTaskSchema, CreateTaskTypes } from "@repo/types";
import React from "react";
import { useForm } from "react-hook-form";
import z from "zod";
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
import { useMutation } from "@tanstack/react-query";
import { createTaskAction } from "@/lib/actions/taskActionts";
import { toast } from "sonner";
import { LoaderCircle } from "lucide-react";

const AddTaskForm = () => {
  const form = useForm({
    resolver: zodResolver(createTaskSchema),
    mode: "onChange",
    defaultValues: {
      title: "",
      description: "",
      deadline: new Date(),
      status: "PLANNED",
      subject: undefined,
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createTaskAction,
    onSuccess: (data) => {
      if (!data.success) {
        toast(data.error || "task creation failed");
        return;
      }

      toast(data.message || "task creation success");
    },
  });

  const disabled = !form.formState.isValid || !form.formState.dirtyFields;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  function handleSubmission(values: CreateTaskTypes) {
    mutate(values);
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

                <FormControl>
                  <Select>
                    <SelectTrigger className="lg:w-[140px]">
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLANNED">Planned</SelectItem>
                      <SelectItem value="ON_PROGRESS">On progress</SelectItem>
                      <SelectItem value="DONE">Done</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end">
          <Button
            disabled={disabled || isPending || form.formState.isSubmitting}
          >
            {isPending ||
              (form.formState.isSubmitting && (
                <LoaderCircle className="animate-spin" />
              ))}
            Create task
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddTaskForm;
