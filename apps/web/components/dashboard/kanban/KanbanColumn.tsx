"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "@repo/db";
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

export function Column({ status, tasks }: ColumnProps) {
  const { setNodeRef } = useDroppable({
    id: status,
    data: {
      type: "Column",
      column: status,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="flex flex-col gap-4 p-4 bg-gray-100/60 rounded-xl"
    >
      <h2 className="text-sm font-semibold tracking-wider text-gray-500 uppercase">
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
