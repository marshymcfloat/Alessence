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
import { Plus } from "lucide-react";

interface AddSummarySheetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function AddSummarySheet({ open: controlledOpen, onOpenChange }: AddSummarySheetProps = {}) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <div className="flex justify-end">
          <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-md shadow-pink-500/20">
            <Plus className="w-4 h-4" />
            Add Summary
          </Button>
        </div>
      </SheetTrigger>
      <SheetContent className="w-full overflow-y-auto p-6! sm:max-w-2xl! lg:max-w-4xl!">
        <SheetHeader className="mb-6!">
          <SheetTitle className="text-2xl! font-bold">
            Create a New Summary
          </SheetTitle>
          <SheetDescription className="text-sm! mt-2!">
            Upload a document and describe what you want the summary to focus
            on. The AI will generate a comprehensive summary tailored for
            accountancy students.
          </SheetDescription>
        </SheetHeader>

        <div className="pr-2!">
          <SummaryForm onSuccess={() => setIsOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
