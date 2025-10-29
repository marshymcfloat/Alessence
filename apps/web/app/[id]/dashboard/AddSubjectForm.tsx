"use client";

import { useForm } from "react-hook-form";
import { createSubjectSchema, CreateSubjectTypes } from "@repo/types";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { createSubjectAction } from "@/lib/actions/subjectActions";
import { toast } from "sonner";
const AddSubjectForm = () => {
  const form = useForm<CreateSubjectTypes>({
    resolver: zodResolver(createSubjectSchema),
    defaultValues: {
      title: "",
      description: "",
      semester: "FIRST",
    },
  });

  const { mutate, isPending } = useMutation({
    mutationFn: createSubjectAction,
    onSuccess: (data) => {
      if (!data.success) {
        toast(data.error || "Creation failed");
        return;
      }

      toast(data.message || "Creation success");
    },
  });

  function handleSubmission(values: CreateSubjectTypes) {
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
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="e.g. Financial Accounting and Reporting"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="semester"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Semester</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a semester" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="FIRST">1st</SelectItem>
                  <SelectItem value="SECOND">2nd</SelectItem>
                </SelectContent>
              </Select>
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
                <Textarea
                  {...field}
                  placeholder="e.g. This course focuses on the preparation, analysis, and interpretation of financial statements in accordance with accounting standards."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end mt-12">
          <Button className="w-fit">Create</Button>
        </div>
      </form>
    </Form>
  );
};

export default AddSubjectForm;
