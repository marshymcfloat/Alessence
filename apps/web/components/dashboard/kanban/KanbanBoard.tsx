"use client";

import { useState } from "react";
import {
  DndContext,
  closestCorners,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { Task } from "@repo/db";
import { Column } from "./KanbanColumn";
import { TaskCard } from "./TaskCard";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ActionReturnType,
  GetAllTasksReturnType,
  UpdateTaskStatusReturnType,
} from "@repo/types";
import { getAllTasks, updateTaskStatus } from "@/lib/actions/taskActionts";

type TaskStatus = "PLANNED" | "ON_PROGRESS" | "DONE";

interface KanbanBoardProps {
  initialTasks: Task[];
}

interface UpdateTaskVariables {
  taskId: string;
  newStatus: TaskStatus;
}

export function KanbanBoard({ initialTasks }: KanbanBoardProps) {
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const { data } = useQuery<ActionReturnType<GetAllTasksReturnType>>({
    queryKey: ["tasks"],
    queryFn: getAllTasks,
    initialData: {
      success: true,
      message: "initial data",
      data: {
        allTasks: initialTasks,
        userId: "",
      },
    },
  });

  const allTasks = data?.data?.allTasks ?? [];

  const { mutate: statusMutate } = useMutation<
    ActionReturnType<UpdateTaskStatusReturnType>,
    Error,
    UpdateTaskVariables,
    { previousTasksData?: ActionReturnType<GetAllTasksReturnType> }
  >({
    mutationFn: async ({ taskId, newStatus }) => {
      const numericId = parseInt(taskId, 10);
      return updateTaskStatus(numericId, newStatus);
    },
    onMutate: async ({ taskId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasksData = queryClient.getQueryData<
        ActionReturnType<GetAllTasksReturnType>
      >(["tasks"]);

      queryClient.setQueryData<ActionReturnType<GetAllTasksReturnType>>(
        ["tasks"],
        (oldData) => {
          if (!oldData || !oldData.data) return oldData;
          const updatedTasks = oldData.data.allTasks.map((task) =>
            task.id === +taskId ? { ...task, status: newStatus } : task
          );
          return {
            ...oldData,
            data: { ...oldData.data, allTasks: updatedTasks },
          };
        }
      );
      return { previousTasksData };
    },
    onError: (err, variables, context) => {
      if (context?.previousTasksData) {
        queryClient.setQueryData(["tasks"], context.previousTasksData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const columns: TaskStatus[] = ["PLANNED", "ON_PROGRESS", "DONE"];

  function handleDragStart(event: DragStartEvent) {
    const activeData = event.active.data.current;
    if (activeData?.type === "Task") {
      setActiveTask(activeData.task);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTask(null);
    const { active, over } = event;

    if (!over) return;

    const activeId = String(active.id);
    const overId = String(over.id);
    const activeTask = allTasks.find((t) => String(t.id) === activeId);

    if (!activeTask) return;

    const isOverAColumn = over.data.current?.type === "Column";
    const isOverATask = over.data.current?.type === "Task";

    if (isOverAColumn) {
      const destColumn = over.id as TaskStatus;
      const sourceColumn = activeTask.status;

      if (sourceColumn !== destColumn) {
        statusMutate({ taskId: activeId, newStatus: destColumn });
      }
    }

    if (isOverATask) {
      const overTask = allTasks.find((t) => String(t.id) === overId);
      if (!overTask) return;

      const sourceColumn = activeTask.status;
      const destColumn = overTask.status;

      if (sourceColumn !== destColumn) {
        queryClient.setQueryData<ActionReturnType<GetAllTasksReturnType>>(
          ["tasks"],
          (oldData) => {
            if (!oldData || !oldData.data) return oldData;

            const currentTasks = oldData.data.allTasks;

            const activeIndex = currentTasks.findIndex(
              (t) => String(t.id) === activeId
            );
            const overIndex = currentTasks.findIndex(
              (t) => String(t.id) === overId
            );

            if (activeIndex === -1 || overIndex === -1) {
              return oldData;
            }

            const taskToUpdate = currentTasks[activeIndex];

            if (!taskToUpdate) {
              return oldData;
            }

            taskToUpdate.status = destColumn;

            const reorderedTasks = arrayMove(
              currentTasks,
              activeIndex,
              overIndex
            );

            return {
              ...oldData,
              data: { ...oldData.data, allTasks: reorderedTasks },
            };
          }
        );
        statusMutate({ taskId: activeId, newStatus: destColumn });
      } else {
        queryClient.setQueryData<ActionReturnType<GetAllTasksReturnType>>(
          ["tasks"],
          (oldData) => {
            if (!oldData || !oldData.data) return oldData;
            const activeIndex = oldData.data.allTasks.findIndex(
              (t) => String(t.id) === activeId
            );
            const overIndex = oldData.data.allTasks.findIndex(
              (t) => String(t.id) === overId
            );

            if (activeIndex === -1 || overIndex === -1) {
              return oldData;
            }

            const reorderedTasks = arrayMove(
              oldData.data.allTasks,
              activeIndex,
              overIndex
            );
            return {
              ...oldData,
              data: { ...oldData.data, allTasks: reorderedTasks },
            };
          }
        );
      }
    }
  }

  return (
    <DndContext
      id="kanban-dnd-context"
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
        {columns.map((status) => (
          <Column
            key={status}
            status={status}
            tasks={allTasks.filter((task) => task.status === status)}
          />
        ))}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCard task={activeTask} isOverlay /> : null}
      </DragOverlay>
    </DndContext>
  );
}
