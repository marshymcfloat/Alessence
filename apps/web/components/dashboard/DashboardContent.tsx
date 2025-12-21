"use client";

import { motion } from "framer-motion";
import { KanbanBoard } from "./kanban/KanbanBoard";
import type { Task } from "@repo/db";
import { StudyTimerSection } from "./StudyTimerSection";
import { NotesSection } from "./NotesSection";
import { PerformanceDashboard } from "./PerformanceDashboard";
import { CalendarView } from "./CalendarView";
import { SubjectsOverview } from "./SubjectsOverview";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  FileText,
  BarChart3,
  Calendar,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { SubjectWithTaskProgress } from "@repo/types";

const DashboardContent = ({
  initialTasks,
  userId,
  subjects,
}: {
  initialTasks: Task[];
  userId: string;
  subjects?: SubjectWithTaskProgress[];
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
        {/* Study Timer Section */}
        <StudyTimerSection />

        {/* Main Content Tabs */}
        <Tabs defaultValue="tasks" className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <TabsList className="grid grid-cols-5">
              <TabsTrigger value="tasks" className="gap-2">
                <ClipboardList className="w-4 h-4" />
                Tasks
              </TabsTrigger>
              <TabsTrigger value="subjects" className="gap-2">
                <GraduationCap className="w-4 h-4" />
                Subjects
              </TabsTrigger>
              <TabsTrigger value="notes" className="gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendar
              </TabsTrigger>
              <TabsTrigger value="analytics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Analytics
              </TabsTrigger>
            </TabsList>
            <Link href={`/${userId}/flashcard`}>
              <Button variant="outline" className="gap-2">
                <BookOpen className="w-4 h-4" />
                Flashcards
              </Button>
            </Link>
          </div>

          <TabsContent value="tasks" className="mt-0">
            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold bg-linear-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Task Board
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organize and track your tasks across different stages
              </p>
            </motion.div>

            {/* Kanban Board */}
            <KanbanBoard initialTasks={initialTasks} />
          </TabsContent>

          <TabsContent value="subjects" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold bg-linear-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Subjects
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your progress across all subjects and courses
              </p>
            </motion.div>
            <SubjectsOverview initialSubjects={subjects} />
          </TabsContent>

          <TabsContent value="notes" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <h1 className="text-4xl font-bold bg-linear-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Notes
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Capture your thoughts, ideas, and study notes
              </p>
            </motion.div>
            <NotesSection />
          </TabsContent>

          <TabsContent value="calendar" className="mt-0">
            <CalendarView />
          </TabsContent>

          <TabsContent value="analytics" className="mt-0">
            <PerformanceDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardContent;
