"use client";

import { motion } from "framer-motion";
import { KanbanBoard } from "./kanban/KanbanBoard";
import { Task } from "@repo/types";

const DashboardContent = ({ 
  initialTasks 
}: { 
  initialTasks: Task[] 
}) => {
  return (
    <div className="h-full p-8 overflow-y-auto custom-scrollbar">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ec4899, #a855f7);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #db2777, #9333ea);
        }
      `}</style>
      <div className="max-w-[1800px] mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
            Task Board
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Organize and track your tasks across different stages
          </p>
        </motion.div>

        {/* Kanban Board */}
        <KanbanBoard initialTasks={initialTasks} />
      </div>
    </div>
  );
};

export default DashboardContent;

