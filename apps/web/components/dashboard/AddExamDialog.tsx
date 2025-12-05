"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ExamsList from "./ExamsList";
import AddExamSheet from "./AddExamSheet";
import ScrollableContainer from "./ScrollableContainer";

export default function AddExamDialog({ onClose }: { onClose: () => void }) {
  return (
    <DialogContent className="!lg:h-[85vh] !flex !flex-col !max-w-6xl !p-0">
      <div className="!p-6 !border-b">
        <DialogHeader>
          <DialogTitle className="!text-2xl !font-bold">Exams</DialogTitle>
        </DialogHeader>
      </div>
      <ScrollableContainer className="!flex-1 !overflow-y-auto !p-6 !min-h-0">
        <ExamsList />
      </ScrollableContainer>
      <div className="!p-6 !border-t !bg-gray-50 dark:!bg-slate-900/50">
        <AddExamSheet />
      </div>
    </DialogContent>
  );
}
