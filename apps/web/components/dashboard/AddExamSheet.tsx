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
        </div>
      </SheetContent>
    </Sheet>
  );
}
