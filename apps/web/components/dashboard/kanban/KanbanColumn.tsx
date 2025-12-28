"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task } from "@repo/db";
import { TaskCard } from "./TaskCard";

type TaskStatus = "PLANNED" | "ON_PROGRESS" | "DONE";

interface ColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

const columnTitles: Record<TaskStatus, string> = {
  PLANNED: "Planned",
  ON_PROGRESS: "In Progress",
  DONE: "Done",
};

const columnStyles: Record<TaskStatus, { bg: string; header: string; headerBg: string }> = {
  PLANNED: {
    bg: "bg-gray-100/60 dark:bg-gray-800/40",
    header: "text-gray-500 dark:text-gray-400",
    headerBg: "",
  },
  ON_PROGRESS: {
    bg: "bg-blue-50/60 dark:bg-blue-950/30",
    header: "text-blue-600 dark:text-blue-400",
    headerBg: "",
  },
  DONE: {
    bg: "bg-green-50/60 dark:bg-green-950/30",
    header: "text-green-600 dark:text-green-400",
    headerBg: "",
  },
};

export function Column({ status, tasks }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: {
      type: "Column",
      column: status,
    },
  });

  const styles = columnStyles[status];

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-4 p-4 ${styles.bg} rounded-xl min-h-[200px]`}
    >
      <h2 className={`text-sm font-semibold tracking-wider uppercase ${styles.header}`}>
        {columnTitles[status]} ({tasks.length})
      </h2>
      <SortableContext
        id={status}
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}
