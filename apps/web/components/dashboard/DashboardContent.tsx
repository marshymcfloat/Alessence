"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { KanbanBoard } from "./kanban/KanbanBoard";
import type { Task } from "@repo/db";
import { PomodoroTimer } from "./PomodoroTimer";
import { StudySessionHistory } from "./StudySessionHistory";
import { FocusMode } from "./FocusMode";
import { GoalProgressCard } from "./GoalProgressCard";
import GoalForm from "./GoalForm";
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
  Timer,
  Target,
  History,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
  const [timerSubTab, setTimerSubTab] = useState<"timer" | "goals" | "history">("timer");

  return (
    <div className="h-full p-4 md:p-6 lg:p-8 overflow-y-auto custom-scrollbar">
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
        {/* Main Content Tabs */}
        <Tabs defaultValue="timer" className="w-full">
          {/* Tab Navigation - Responsive */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0 -mx-4 px-4 sm:mx-0 sm:px-0">
              <TabsList className="inline-flex h-auto p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger 
                  value="timer" 
                  className="gap-1.5 px-2 xs:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Timer className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Timer</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="tasks" 
                  className="gap-1.5 px-2 xs:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <ClipboardList className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Tasks</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="subjects" 
                  className="gap-1.5 px-2 xs:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <GraduationCap className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Subjects</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="notes" 
                  className="gap-1.5 px-2 xs:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Notes</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="calendar" 
                  className="gap-1.5 px-2 xs:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Calendar</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="analytics" 
                  className="gap-1.5 px-2 xs:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Analytics</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <Link href={`/${userId}/flashcard`} className="shrink-0">
              <Button 
                variant="outline" 
                size="sm"
                className="gap-2 border-pink-200 dark:border-pink-800 hover:bg-pink-50 dark:hover:bg-pink-950/30"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Flashcards</span>
              </Button>
            </Link>
          </div>

          {/* Timer Tab Content */}
          <TabsContent value="timer" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Timer Header */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                  Study Timer
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Focus with Pomodoro technique - 25 minutes of focused study
                </p>
              </div>

              {/* Timer Sub-tabs */}
              <div className="flex flex-col gap-6">
                {/* Timer Sub-navigation - Horizontal on all screens */}
                <div className="flex justify-center gap-2">
                  <button
                    onClick={() => setTimerSubTab("timer")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      timerSubTab === "timer"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Timer className="w-4 h-4" />
                    <span>Timer</span>
                  </button>
                  <button
                    onClick={() => setTimerSubTab("goals")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      timerSubTab === "goals"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Target className="w-4 h-4" />
                    <span>Goals</span>
                  </button>
                  <button
                    onClick={() => setTimerSubTab("history")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      timerSubTab === "history"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </button>
                </div>

                {/* Timer Content Area */}
                <div className="w-full">
                  {timerSubTab === "timer" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex justify-center"
                    >
                      <PomodoroTimer onEnterFocusMode={() => setIsFocusModeOpen(true)} />
                    </motion.div>
                  )}

                  {timerSubTab === "goals" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-6 max-w-4xl mx-auto"
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <h3 className="text-lg font-semibold">Study Goals</h3>
                          <p className="text-sm text-muted-foreground">
                            Track your daily and weekly study time goals
                          </p>
                        </div>
                        <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                          <DialogTrigger asChild>
                            <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                              <Plus className="w-4 h-4" />
                              New Goal
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Create Study Goal</DialogTitle>
                              <DialogDescription>
                                Set a daily or weekly study time goal to track your progress
                              </DialogDescription>
                            </DialogHeader>
                            <GoalForm onSuccess={() => setIsGoalDialogOpen(false)} />
                          </DialogContent>
                        </Dialog>
                      </div>
                      <GoalProgressCard />
                    </motion.div>
                  )}

                  {timerSubTab === "history" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="max-w-4xl mx-auto"
                    >
                      <StudySessionHistory />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Focus Mode Overlay */}
            <FocusMode
              isOpen={isFocusModeOpen}
              onClose={() => setIsFocusModeOpen(false)}
            />
          </TabsContent>

          {/* Tasks Tab Content */}
          <TabsContent value="tasks" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Task Board
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Organize and track your tasks across different stages
              </p>
            </motion.div>
            <KanbanBoard initialTasks={initialTasks} />
          </TabsContent>

          {/* Subjects Tab Content */}
          <TabsContent value="subjects" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Subjects
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your progress across all subjects and courses
              </p>
            </motion.div>
            <SubjectsOverview initialSubjects={subjects} />
          </TabsContent>

          {/* Notes Tab Content */}
          <TabsContent value="notes" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Notes
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Capture your thoughts, ideas, and study notes
              </p>
            </motion.div>
            <NotesSection />
          </TabsContent>

          {/* Calendar Tab Content */}
          <TabsContent value="calendar" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Calendar
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                View your tasks and study sessions on a calendar
              </p>
            </motion.div>
            <CalendarView />
          </TabsContent>

          {/* Analytics Tab Content */}
          <TabsContent value="analytics" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-6"
            >
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                Analytics
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Track your study performance and progress over time
              </p>
            </motion.div>
            <PerformanceDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DashboardContent;
