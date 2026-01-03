"use client";

import { motion } from "framer-motion";
import { KanbanBoard } from "../kanban/KanbanBoard";
import { Task } from "@repo/db";

interface TasksTabProps {
  initialTasks: Task[];
}

export function TasksTab({ initialTasks }: TasksTabProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="h-[calc(100vh-140px)] flex flex-col"
    >
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          Tasks & Projects
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Manage your tasks and study plans with Kanban board
        </p>
      </div>
      <div className="flex-1 min-h-0">
        <KanbanBoard initialTasks={initialTasks} />
      </div>
    </motion.div>
  );
}
