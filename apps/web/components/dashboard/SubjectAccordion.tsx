"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SubjectWithTaskProgress } from "@repo/types";
import SubjectPieChart from "./SubjectPieChart";
import { BookOpen, CheckCircle2, Clock, Circle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSubjectAction } from "@/lib/actions/subjectActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";

const SubjectAccordion = ({
  subject,
}: {
  subject: SubjectWithTaskProgress;
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const { taskCounts } = subject;
  const total = taskCounts.total;
  const progressPercentage =
    total > 0 ? Math.round((taskCounts.done / total) * 100) : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (
      !confirm(
        `Are you sure you want to delete "${subject.title}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    const result = await deleteSubjectAction(subject.id);
    setIsDeleting(false);

    if (result.success) {
      toast.success(result.message || "Subject deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete subject");
    }
  };

  return (
    <AccordionItem
      value={subject.id.toString()}
      className="border border-gray-200 rounded-lg px-3 py-1 bg-white/50 hover:bg-white/80 transition-colors"
    >
      <AccordionTrigger className="hover:no-underline py-3">
        <div className="flex items-center gap-3 w-full">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-pink-400 to-purple-400 flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-medium text-sm text-gray-800 capitalize">
              {subject.title}
            </div>
            {total > 0 && (
              <div className="text-xs text-gray-500 mt-0.5">
                {taskCounts.done}/{total} tasks completed
              </div>
            )}
          </div>
          {total > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span className="font-semibold">{progressPercentage}%</span>
            </div>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">
        <div className="space-y-4">
          {total > 0 && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <div className="flex items-center gap-2 p-2 rounded-md bg-green-50 border border-green-100">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <div>
                  <div className="text-xs font-semibold text-green-700">
                    {taskCounts.done}
                  </div>
                  <div className="text-[10px] text-green-600">Done</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-blue-50 border border-blue-100">
                <Clock className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-semibold text-blue-700">
                    {taskCounts.onProgress}
                  </div>
                  <div className="text-[10px] text-blue-600">In Progress</div>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 border border-yellow-100">
                <Circle className="w-4 h-4 text-yellow-600" />
                <div>
                  <div className="text-xs font-semibold text-yellow-700">
                    {taskCounts.planned}
                  </div>
                  <div className="text-[10px] text-yellow-600">Planned</div>
                </div>
              </div>
            </div>
          )}

          {subject.description && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
                Description
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                {subject.description}
              </p>
            </div>
          )}

          {total > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h4 className="text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">
                Progress Overview
              </h4>
              <SubjectPieChart taskCounts={subject.taskCounts} />
            </div>
          )}

          {total === 0 && !subject.description && (
            <div className="text-center py-4 text-xs text-gray-400">
              No tasks or description yet
            </div>
          )}

          <div className="pt-2 border-t border-gray-100 flex justify-end">
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
              className=""
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
};

export default SubjectAccordion;
