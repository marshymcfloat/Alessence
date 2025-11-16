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
import { Task } from "@repo/db";
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

  // Get colors based on subject and deadline
  const taskWithSubject = task as TaskWithSubject;
  const subjectId = taskWithSubject.subject?.id || task.subjectId;
  const subjectLeftBorder = getSubjectLeftBorder(subjectId);
  const subjectBg = getSubjectBackground(subjectId);
  const deadlineUrgency = getDeadlineUrgency(new Date(task.deadline));
  const deadlineBorder = getDeadlineBorderColor(deadlineUrgency);

  // Combine colors: left border (4px) for subject, top border (2px) for deadline urgency
  // Extract just the color from deadlineBorder (remove border-2 if present)
  const deadlineColorClass = deadlineBorder.includes("border-red-500")
    ? "border-t-red-500"
    : deadlineBorder.includes("border-orange-500")
      ? "border-t-orange-500"
      : deadlineBorder.includes("border-yellow-500")
        ? "border-t-yellow-500"
        : "border-t-gray-300";

  const borderClasses = `${subjectLeftBorder} border-l-4 ${deadlineColorClass} border-t-2 border-r border-b border-r-gray-200 border-b-gray-200`;

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
            className={`${subjectBg} ${borderClasses} p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-grab`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-800">{task.title}</h3>
                {task.description && (
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
                {taskWithSubject.subject && (
                  <p className="text-xs text-gray-500 mt-2 font-medium">
                    {taskWithSubject.subject.title}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-400">
                Due: {new Date(task.deadline).toLocaleDateString()}
              </p>
              {deadlineUrgency === "overdue" && (
                <span className="text-xs font-semibold text-red-600">
                  Overdue
                </span>
              )}
              {deadlineUrgency === "urgent" && (
                <span className="text-xs font-semibold text-orange-600">
                  Urgent
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

          <ContextMenuItem className="text-red-500 focus:text-red-500">
            <Trash className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </ContextMenuItem>
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
