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
import { Loader2, Plus, Zap, AlertCircle } from "lucide-react";
import { getEnrolledSubject } from "@/lib/actions/subjectActions";
import type { Subject } from "@repo/db";
import { createMockExam, createExam } from "@/lib/actions/examActionts";
import { getAllFiles } from "@/lib/actions/fileActionts";
import { toast } from "sonner";
import { queryClient } from "../providers/TanstackProvider";
import UploadFiles from "./UploadFiles";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function CreateMockExamSheet() {
  const [isOpen, setIsOpen] = useState(false);
  const [subjectId, setSubjectId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [files, setFiles] = useState<any[]>([]);

  const { data: subjectsData, isLoading: isLoadingSubjects } = useQuery({
    queryKey: ["subjects"],
    queryFn: getEnrolledSubject,
  });

  const { data: filesData, isLoading: isLoadingFiles } = useQuery({
    queryKey: ["all-files"],
    queryFn: getAllFiles,
  });

  const mockExamMutation = useMutation({
    mutationFn: (data: { id: number; title: string }) =>
      createMockExam(data.id, data.title),
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "Mock finals exam is being generated!");
        queryClient.invalidateQueries({ queryKey: ["exams"] });
        setIsOpen(false);
        setTitle(""); // Reset title
      } else {
        toast.error(res.error || "Failed to create mock exam.");
      }
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unexpected error occurred during mock exam generation"
      );
    },
  });

  const customExamMutation = useMutation({
    mutationFn: createExam,
    onSuccess: (res) => {
      if (res.success) {
        toast.success(res.message || "Mock finals exam is being generated!");
        queryClient.invalidateQueries({ queryKey: ["exams"] });
        setIsOpen(false);
        setTitle(""); // Reset title
      } else {
        toast.error(res.error || "Failed to create mock exam.");
      }
    },
    onError: (err) => {
      toast.error(
        err instanceof Error
          ? err.message
          : "Unexpected error occurred during mock exam generation"
      );
    },
  });

  const subjects = subjectsData?.data?.subjects || [];
  const subjectFiles =
    filesData?.data?.files.filter((f) => f.subjectId === subjectId) || [];
  const hasExistingFiles = subjectFiles.length > 0;

  const handleGenerate = () => {
    if (!subjectId) return;

    const selectedSubject = subjects.find((s) => s.id === subjectId);
    const subjectTitle = selectedSubject?.title || "selected subject";

    if (files.length > 0) {
      // Use regular exam creation with uploaded files
      customExamMutation.mutate({
        subjectId,
        items: 70,
        timeLimit: 120,
        isPracticeMode: false,
        questionTypes: ["MULTIPLE_CHOICE", "TRUE_FALSE", "IDENTIFICATION"],
        describe:
          title ||
          `EXPERT-LEVEL FINALS SIMULATION: Generate a comprehensive "Finals Exam" for the subject: "${subjectTitle}" using the provided reference materials. 
        INSTRUCTIONS: 
        1. Leverage the specific data and principles found in the uploaded files. 
        2. Questions must require higher-order thinking (Analysis, Synthesis, Evaluation).
        3. For accounting, focus on complex adjustments and multi-step calculations. 
        4. For law, focus on case scenarios that test the application of specific provisions or jurisprudence. 
        5. Maintain a professional, rigorous tone equivalent to professional licensure standards.`,
        files: files,
      });
    } else if (hasExistingFiles) {
      // Use the quick mock generation (uses existing subject files on backend)
      mockExamMutation.mutate({ id: subjectId, title });
    } else {
      // NO FILES case: Use customExamMutation with empty files and enhanced description
      // NO FILES case: still use mockExamMutation (backend now handles no-files case)
      mockExamMutation.mutate({ id: subjectId, title });
    }
  };

  const isPending = mockExamMutation.isPending || customExamMutation.isPending;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-pink-200 hover:border-pink-300 hover:bg-pink-50 dark:border-pink-900/50 dark:hover:bg-pink-950/30 transition-all shadow-sm"
        >
          <Zap className="w-4 h-4 text-pink-500" />
          <span>Generate Mock Exam</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto !p-6 sm:!max-w-2xl">
        <SheetHeader className="!mb-8">
          <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-pink-600 dark:text-pink-400" />
          </div>
          <SheetTitle className="!text-2xl font-bold">
            Mock Finals Exam
          </SheetTitle>
          <SheetDescription className="!text-sm !mt-2">
            Generate a comprehensive 70-item, timed finals exam simulation.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              1. Exam Title (Optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Finals Reviewer 2024"
              className="flex h-12 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              2. Select Subject
            </label>
            <Select
              value={subjectId ? String(subjectId) : ""}
              onValueChange={(v) => {
                setSubjectId(Number(v));
                setFiles([]); // Reset files when subject changes
              }}
              disabled={isLoadingSubjects || isPending}
            >
              <SelectTrigger className="w-full !h-12 border-muted-foreground/20 focus:ring-pink-500/20">
                <SelectValue
                  placeholder={
                    isLoadingSubjects
                      ? "Loading subjects..."
                      : "Choose a subject"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject: Subject) => (
                  <SelectItem key={subject.id} value={String(subject.id)}>
                    {subject.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground flex justify-between items-center">
                <span>3. Upload Reference Materials (Optional)</span>
                {hasExistingFiles && (
                  <span className="text-[10px] text-green-600 font-semibold px-2 py-0.5 bg-green-50 rounded-full">
                    {subjectFiles.length} files already available
                  </span>
                )}
              </label>
              <div className="!min-h-[150px]">
                <UploadFiles value={files} onChange={setFiles} />
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                * If you upload files here, they will be used. If not, we'll try
                to use existing library files or generate from the subject name.
              </p>
            </div>

            {subjectId &&
              !isLoadingFiles &&
              !hasExistingFiles &&
              files.length === 0 && (
                <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/50">
                  <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  <AlertTitle className="text-amber-800 dark:text-amber-300 font-semibold">
                    Caution: No Study Materials
                  </AlertTitle>
                  <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
                    You haven't uploaded any files for this subject. The exam
                    will be generated based purely on the subject name. This
                    might result in questions that are too broad or not
                    perfectly aligned with your specific curriculum.
                  </AlertDescription>
                </Alert>
              )}
          </div>

          <Card className="p-4 bg-muted/30 border-none">
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Mock Finals Settings:
            </h4>
            <ul className="text-xs text-muted-foreground grid grid-cols-2 gap-2">
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-pink-500" />
                70 Items
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-pink-500" />
                120 Minutes
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-pink-500" />
                Randomized Types
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-pink-500" />
                Finals Simulation
              </li>
            </ul>
          </Card>

          <Button
            disabled={!subjectId || isPending}
            onClick={handleGenerate}
            className="w-full !h-12 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg shadow-pink-500/20 transition-all font-semibold"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Exam...
              </>
            ) : (
              "Generate Exam Now"
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
