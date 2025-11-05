"use user client";

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
import { Edit, Eye, Trash } from "lucide-react";
import AddTaskDialog from "../AddTaskDialog"; // Assuming this component exists

interface TaskCardProps {
  task: Task;
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
      type: "Task", // ❗️ Identify this as a Task draggable
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
            className="bg-white p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 cursor-grab"
          >
            <h3 className="font-semibold text-gray-800">{task.title}</h3>
            {task.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {task.description}
              </p>
            )}
            <p className="text-xs text-gray-400 mt-3">
              Due: {new Date(task.deadline).toLocaleDateString()}
            </p>
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
