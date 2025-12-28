"use client";

import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SubjectWithTaskProgress } from "@repo/types";
import SubjectPieChart from "./SubjectPieChart";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Circle,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteSubjectAction } from "@/lib/actions/subjectActions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

const SubjectAccordion = ({
  subject,
}: {
  subject: SubjectWithTaskProgress;
}) => {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();
  const { taskCounts } = subject;
  const total = taskCounts.total;
  const progressPercentage =
    total > 0 ? Math.round((taskCounts.done / total) * 100) : 0;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete Subject",
      description: `Are you sure you want to delete "${subject.title}"? This action cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });
    
    if (!confirmed) return;

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
      className="group border-2 border-gray-200/60 dark:border-gray-700/60 rounded-xl overflow-hidden bg-gradient-to-br from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 hover:from-white dark:hover:from-slate-800/90 hover:shadow-lg hover:border-pink-300/50 dark:hover:border-pink-700/50 transition-all duration-300"
    >
      <AccordionTrigger className="hover:no-underline py-4 px-4">
        <div className="flex items-center gap-4 w-full">
          {/* Icon with gradient background */}
          <motion.div
            whileHover={{ scale: 1.1, rotate: 5 }}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 via-purple-500 to-blue-500 shadow-lg flex items-center justify-center shrink-0"
          >
            <BookOpen className="w-5 h-5 text-white" />
          </motion.div>

          {/* Subject Info */}
          <div className="flex-1 text-left min-w-0">
            <div className="font-semibold text-sm text-gray-800 dark:text-gray-100 capitalize truncate">
              {subject.title}
            </div>
            {total > 0 ? (
              <div className="flex items-center gap-2 mt-1">
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {taskCounts.done}/{total} completed
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-pink-100 to-purple-100 dark:from-pink-900/30 dark:to-purple-900/30">
                  <TrendingUp className="w-3 h-3 text-pink-600 dark:text-pink-400" />
                  <span className="text-xs font-bold text-pink-600 dark:text-pink-400">
                    {progressPercentage}%
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                No tasks yet
              </div>
            )}
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pt-2 pb-5 px-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-5"
        >
          {/* Task Stats Grid */}
          {total > 0 && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200/50 dark:border-green-800/50 shadow-sm"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="text-center">
                  <div className="text-lg font-bold text-green-700 dark:text-green-300">
                    {taskCounts.done}
                  </div>
                  <div className="text-[10px] font-medium text-green-600 dark:text-green-400 uppercase tracking-wide">
                    Done
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border-2 border-blue-200/50 dark:border-blue-800/50 shadow-sm"
              >
                <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                    {taskCounts.onProgress}
                  </div>
                  <div className="text-[10px] font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                    Active
                  </div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-2 border-yellow-200/50 dark:border-yellow-800/50 shadow-sm"
              >
                <Circle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-center">
                  <div className="text-lg font-bold text-yellow-700 dark:text-yellow-300">
                    {taskCounts.planned}
                  </div>
                  <div className="text-[10px] font-medium text-yellow-600 dark:text-yellow-400 uppercase tracking-wide">
                    Planned
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* Description */}
          {subject.description && (
            <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
                Description
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed pl-3">
                {subject.description}
              </p>
            </div>
          )}

          {/* Progress Chart */}
          {total > 0 && (
            <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
                <div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-purple-500 rounded-full" />
                Progress Overview
              </h4>
              <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-slate-800/50 dark:to-slate-900/50 rounded-xl p-3 border border-gray-200/50 dark:border-gray-700/50">
                <SubjectPieChart taskCounts={subject.taskCounts} />
              </div>
            </div>
          )}

          {/* Empty State */}
          {total === 0 && !subject.description && (
            <div className="text-center py-6 px-4 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-slate-800/30 dark:to-slate-900/30 border-2 border-dashed border-gray-300 dark:border-gray-700">
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                No tasks or description yet
              </p>
            </div>
          )}

          {/* Delete Button */}
          <div className="pt-3 border-t-2 border-gray-200 dark:border-gray-700 flex justify-end">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
                className="shadow-md hover:shadow-lg transition-shadow bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700"
              >
                <Trash2 className="w-4 h-4 mr-1.5" />
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </AccordionContent>

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </AccordionItem>
  );
};

export default SubjectAccordion;
