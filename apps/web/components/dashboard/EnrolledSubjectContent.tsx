"use client";

import { SubjectWithTaskProgress } from "@repo/types";
import SubjectAccordion from "./SubjectAccordion";
import { Accordion } from "@/components/ui/accordion";
import { BookOpen } from "lucide-react";

const EnrolledSubjectContent = ({
  data,
}: {
  data: SubjectWithTaskProgress[] | undefined;
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-2">
            <BookOpen className="w-6 h-6 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            No subjects enrolled
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Add a subject to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
      <Accordion type="single" collapsible className="w-full space-y-1.5">
        {data?.map((subject) => (
          <SubjectAccordion key={subject.id} subject={subject} />
        ))}
      </Accordion>
    </div>
  );
};

export default EnrolledSubjectContent;
