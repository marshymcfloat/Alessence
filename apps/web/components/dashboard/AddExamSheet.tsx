"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import ExamForm from "./ExamForm";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import type { Subject } from "@repo/db";
import { createMockExam } from "@/lib/actions/examActionts";
import { toast } from "sonner";

export default function AddExamSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [mockSubjectId, setMockSubjectId] = useState<number | null>(null);

  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getEnrolledSubject,
  });

  const mockExamMutation = useMutation({
    mutationFn: createMockExam,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "Mock exam is being generated!");
        setIsOpen(false);
      } else {
        toast.error(res.error || "Failed to create mock exam.");
      }
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Unexpected error");
    },
  });

  const subjects = subjectsData?.data?.subjects || [];

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="flex justify-end">
          <Button>Add Exam</Button>
        </div>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto !p-6 sm:!max-w-2xl lg:!max-w-4xl">
        <SheetHeader className="!mb-6">
          <SheetTitle className="!text-2xl font-bold">
            Create a New Exam
          </SheetTitle>
          <SheetDescription className="!text-sm !mt-2">
            Select a subject, choose your reviewer files, and describe the exam
            you want to generate.
          </SheetDescription>
        </SheetHeader>

        <div className="!pr-2">
          <ExamForm onSuccess={() => setIsOpen(false)} />

          <Card className="mt-8 p-4 space-y-3 border-dashed">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold">Mock Board Exam</h3>
                <p className="text-xs text-muted-foreground">
                  Generate a 70-item, timed exam for a subject.
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <Select
                value={mockSubjectId ? String(mockSubjectId) : ""}
                onValueChange={(v) => setMockSubjectId(Number(v))}
                disabled={isLoadingSubjects || mockExamMutation.isPending}
              >
                <SelectTrigger className="!h-11">
                  <SelectValue placeholder="Select subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject: Subject) => (
                    <SelectItem key={subject.id} value={String(subject.id)}>
                      {subject.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                disabled={!mockSubjectId || mockExamMutation.isPending}
                onClick={() => mockSubjectId && mockExamMutation.mutate(mockSubjectId)}
                className="!h-11"
              >
                {mockExamMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {mockExamMutation.isPending ? "Generating..." : "Generate Mock Exam"}
              </Button>
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
}
