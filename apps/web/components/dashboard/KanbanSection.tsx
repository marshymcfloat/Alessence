"use client";

import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
  type DragEndEvent,
  type KanbanItemProps,
} from "@/components/ui/shadcn-io/kanban";
import { getAllTasks, updateTaskStatus } from "@/lib/actions/taskActionts";
import { Task, TaskStatusEnum } from "@repo/db";
import type { ActionReturnType, GetAllTasksReturnType } from "@repo/types";
import { arrayMove } from "@dnd-kit/sortable";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// Define a type for the tasks formatted for the Kanban component
interface FormattedTask extends KanbanItemProps {
  originalTask: Task;
}

// Define the columns for the Kanban board
const columns = [
  { id: TaskStatusEnum.PLANNED, name: "Planned" },
  { id: TaskStatusEnum.ON_PROGRESS, name: "In Progress" },
  { id: TaskStatusEnum.DONE, name: "Done" },
];

const KanbanSection = ({
  initialData,
}: {
  initialData: Task[] | undefined;
}) => {
  const queryClient = useQueryClient();

  // Fetch tasks using React Query, providing initial data for SSR
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

  // Use local state to manage the UI, allowing for optimistic updates
  const [localTasks, setLocalTasks] = useState<Task[]>(initialData || []);

  // Sync local state with the data from React Query when it updates
  useEffect(() => {
    if (queryData?.success && queryData.data?.allTasks) {
      setLocalTasks(queryData.data.allTasks);
    }
  }, [queryData]);

  // Mutation for updating a task's status
  const { mutate: mutateTaskStatus } = useMutation({
    // The function that performs the update. It will now throw an error on failure.
    mutationFn: ({ id, status }: { id: number; status: TaskStatusEnum }) =>
      updateTaskStatus(id, status),

    // This function runs immediately when `mutate` is called, before the mutationFn
    onMutate: async ({ id, status }) => {
      // Cancel any outgoing refetches so they don't overwrite our optimistic update
      await queryClient.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot the previous value of tasks
      const previousTasks = queryClient.getQueryData<
        ActionReturnType<GetAllTasksReturnType>
      >(["tasks"]);

      // Optimistically update the local state.
      // We just change the status, and the UI will automatically move the card.
      setLocalTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, status } : task))
      );

      // Return a context object with the snapshotted value
      return { previousTasks };
    },

    // This function runs if the mutationFn throws an error
    onError: (err, updatedTask, context) => {
      // If we have a snapshot of the previous state, roll back the UI
      if (context?.previousTasks?.data?.allTasks) {
        setLocalTasks(context.previousTasks.data.allTasks);
        toast.error("Failed to update task. Your changes have been reverted.");
      } else {
        toast.error("An error occurred while updating the task.");
      }
    },

    // This function runs on either success or error, after the mutation is settled
    onSettled: () => {
      // Always refetch the tasks query to ensure the client state is in sync with the server
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },

    // This function runs only if the mutationFn resolves successfully
    onSuccess: () => {
      toast.success("Task status updated successfully!");
    },
  });

  // Memoize the formatted tasks to prevent unnecessary re-renders
  const formattedTasks: FormattedTask[] = useMemo(() => {
    return localTasks.map((task) => ({
      id: task.id.toString(),
      name: task.title,
      column: task.status,
      originalTask: task,
    }));
  }, [localTasks]);

  // Handler for when a drag-and-drop operation ends
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    // Do nothing if there's no destination or if the item is dropped back in place
    if (!over || active.id === over.id) {
      return;
    }

    const taskToMove = localTasks.find((t) => t.id.toString() === active.id);
    if (!taskToMove) return;

    // Determine the new status based on where the card was dropped.
    // It could be dropped on a column (droppable) or another card (draggable).
    const overIsAColumn = columns.some((c) => c.id === over.id);
    const newStatus = (
      overIsAColumn
        ? over.id
        : formattedTasks.find((t) => t.id === over.id)?.column
    ) as TaskStatusEnum | undefined;

    if (!newStatus) return;

    // Check if the status has actually changed (moved to a new column)
    if (taskToMove.status !== newStatus) {
      // If the status changed, call the mutation to update it on the server
      mutateTaskStatus({
        id: taskToMove.id,
        status: newStatus,
      });
    } else {
      // If the status is the same, it's just a reorder within the same column.
      // Update the local state for a smooth UI experience.
      // Note: This reordering is client-side only. To persist it, you would
      // need another mutation that updates task order/priority on the backend.
      const oldIndex = localTasks.findIndex(
        (t) => t.id.toString() === active.id
      );
      const newIndex = localTasks.findIndex((t) => t.id.toString() === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        setLocalTasks((prev) => arrayMove(prev, oldIndex, newIndex));
      }
    }
  };

  return (
    <KanbanProvider
      columns={columns}
      data={formattedTasks}
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
