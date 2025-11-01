"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type DragEndEvent,
  type KanbanItemProps, // FIX: Import the base type from the component
} from "@/components/ui/shadcn-io/kanban";
import { getAllTasks } from "@/lib/actions/taskActionts";
import { Task, TaskStatusEnum } from "@repo/db";
import type { ActionReturnType, GetAllTasksReturnType } from "@repo/types";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
interface FormattedTask extends KanbanItemProps {
  originalTask: Task;
}

// Column definition remains the same
const columns = [
  { id: "PLANNED" as TaskStatusEnum, name: "Planned" },
  { id: "ON_PROGRESS" as TaskStatusEnum, name: "In Progress" },
  { id: "DONE" as TaskStatusEnum, name: "Done" },
];

const KanbanSection = ({
  initialData,
}: {
  initialData: Task[] | undefined;
}) => {
  const { data: queryData } = useQuery<ActionReturnType<GetAllTasksReturnType>>(
    {
      queryKey: ["tasks"],
      queryFn: getAllTasks,
      initialData: {
        success: true,
        data: { allTasks: initialData || [], userId: "" },
      },
    }
  );

  const [localTasks, setLocalTasks] = useState<Task[]>(initialData || []);

  useEffect(() => {
    if (queryData?.success && queryData.data?.allTasks) {
      setLocalTasks(queryData.data.allTasks);
    }
  }, [queryData]);

  const formattedTasks: FormattedTask[] = useMemo(() => {
    return localTasks.map((task) => ({
      id: task.id.toString(),
      name: task.title,
      column: task.status,
      originalTask: task,
    }));
  }, [localTasks]);

  const handleDataChange = (newData: KanbanItemProps[]) => {
    const updatedTasks = (newData as FormattedTask[]).map((formattedTask) => {
      const { originalTask } = formattedTask;
      originalTask.status = formattedTask.column as TaskStatusEnum;
      return originalTask;
    });
    setLocalTasks(updatedTasks);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const movedTask = localTasks.find((t) => t.id.toString() === active.id);

      if (movedTask) {
        console.log(
          `Task "${movedTask.title}" moved. New status: ${movedTask.status}. Ready to mutate.`
        );
      }
    }
  };

  return (
    <KanbanProvider
      columns={columns}
      data={formattedTasks}
      onDataChange={handleDataChange}
      onDragEnd={handleDragEnd}
    >
      {(column) => (
        <KanbanBoard id={column.id} key={column.id}>
          <KanbanHeader>{column.name}</KanbanHeader>

          <KanbanCards<FormattedTask> id={column.id}>
            {(task) => (
              <KanbanCard
                id={task.id}
                key={task.id}
                name={task.name}
                column={task.column}
              >
                <div className="flex flex-col gap-2">
                  <p className="font-medium text-sm">{task.name}</p>

                  {task.originalTask.description && (
                    <p className="text-xs text-muted-foreground">
                      {task.originalTask.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Due:{" "}
                    {new Date(task.originalTask.deadline).toLocaleDateString()}
                  </p>
                </div>
              </KanbanCard>
            )}
          </KanbanCards>
        </KanbanBoard>
      )}
    </KanbanProvider>
  );
};

export default KanbanSection;
