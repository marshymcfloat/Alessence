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
import SummaryForm from "./SummaryForm";

export default function AddSummarySheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="flex justify-end">
          <Button>Add Summary</Button>
        </div>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto p-4 sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Create a New Summary</SheetTitle>
          <SheetDescription>
            Upload a document and describe what you want the summary to focus on.
            The AI will generate a comprehensive summary tailored for accountancy students.
          </SheetDescription>
        </SheetHeader>

        <SummaryForm onSuccess={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

