"use client";

import { useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@repo/db";
import { TaskWithSubject } from "@repo/types";
import { Edit, Eye, Trash } from "lucide-react";
import AddTaskDialog from "../AddTaskDialog";
import {
  getSubjectLeftBorder,
  getSubjectBackground,
  getDeadlineUrgency,
  getDeadlineBorderColor,
} from "@/lib/utils/taskColors";

interface TaskCardProps {
  task: Task | TaskWithSubject;
  isOverlay?: boolean;
}

export function TaskCard({ task, isOverlay }: TaskCardProps) {
  const isDone = task.status === "DONE";
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "Task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.5 : 1,
  };

  const overlayStyle = isOverlay
    ? {
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transform: "rotate(3deg) scale(1.05)",
      }
    : {};

  const taskWithSubject = task as TaskWithSubject;
  const subjectId = taskWithSubject.subject?.id || task.subjectId;
  const subjectLeftBorder = getSubjectLeftBorder(subjectId);
  const subjectBg = getSubjectBackground(subjectId);
  const deadlineUrgency = isDone ? "normal" : getDeadlineUrgency(new Date(task.deadline));
  const deadlineBorder = isDone ? "border-green-500" : getDeadlineBorderColor(deadlineUrgency);

  // For done tasks, use green border; otherwise use deadline-based colors
  const deadlineColorClass = isDone
    ? "border-t-green-500"
    : deadlineBorder.includes("border-red-500")
      ? "border-t-red-500"
      : deadlineBorder.includes("border-orange-500")
        ? "border-t-orange-500"
        : deadlineBorder.includes("border-yellow-500")
          ? "border-t-yellow-500"
          : "border-t-gray-300";

  // Done tasks get a muted left border
  const leftBorderClass = isDone ? "border-l-green-500" : subjectLeftBorder;
  
  const borderClasses = `${leftBorderClass} border-l-4 ${deadlineColorClass} border-t-2 border-r border-b border-r-gray-200 dark:border-r-gray-700 border-b-gray-200 dark:border-b-gray-700`;

  return (
    <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
      <DialogHeader className="hidden">
        <DialogTitle></DialogTitle>
      </DialogHeader>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            ref={setNodeRef}
            style={{ ...style, ...overlayStyle }}
            {...attributes}
            {...listeners}
            className={`${isDone ? "bg-green-50/80 dark:bg-green-950/30" : subjectBg} ${borderClasses} p-4 rounded-xl shadow-md dark:shadow-slate-900/50 hover:shadow-lg dark:hover:shadow-slate-900/70 transition-shadow duration-200 cursor-grab ${isDone ? "opacity-75" : ""}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {isDone && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                  )}
                  <h3 className={`font-semibold ${isDone ? "text-gray-500 dark:text-gray-400 line-through" : "text-gray-800 dark:text-black"}`}>
                    {task.title}
                  </h3>
                </div>
                {task.description && (
                  <p className={`text-sm mt-1 line-clamp-2 ${isDone ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"}`}>
                    {task.description}
                  </p>
                )}
                {taskWithSubject.subject && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
                    {taskWithSubject.subject.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400 dark:text-gray-500">
                {isDone ? "Completed" : `Due: ${new Date(task.deadline).toLocaleDateString()}`}
              </p>
              {!isDone && deadlineUrgency === "overdue" && (
                <span className="text-xs font-semibold text-red-600 dark:text-red-400">
                  Overdue
                </span>
              )}
              {!isDone && deadlineUrgency === "urgent" && (
                <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                  Urgent
                </span>
              )}
              {isDone && (
                <span className="text-xs font-semibold text-green-600 dark:text-green-400">
                  Done
                </span>
              )}
            </div>
          </div>
        </ContextMenuTrigger>

        <ContextMenuContent>
          <ContextMenuItem>
            <Eye className="mr-2 h-4 w-4" />
            <span>View Details</span>
          </ContextMenuItem>

          <DialogTrigger asChild>
            <ContextMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              <span>Edit</span>
            </ContextMenuItem>
          </DialogTrigger>
        </ContextMenuContent>
      </ContextMenu>

      <DialogContent>
        <AddTaskDialog
          initialData={task}
          onClose={() => setIsEditDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
