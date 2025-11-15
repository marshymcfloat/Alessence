// components/AddExamSheet.tsx
"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import ExamForm from "./ExamForm";

export default function AddExamSheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="flex justify-end">
          <Button>Add Exam</Button>
        </div>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create a New Exam</SheetTitle>
          <SheetDescription>
            Select a subject, choose your reviewer files, and describe the exam
            you want to generate.
          </SheetDescription>
        </SheetHeader>

        <ExamForm onSuccess={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
