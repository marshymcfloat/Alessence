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
import ExamsList from "./ExamsList";
import SummariesList from "./SummariesList";
import { FlashcardDeckList } from "./FlashcardDeckList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ClipboardList,
  FileText,
  BarChart3,
  Calendar,
  GraduationCap,
  Timer,
  Target,
  History,
  Plus,
  Library,
  FileQuestion,
  ScrollText,
  Layers,
  RefreshCw,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
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
import AddExamSheet from "./AddExamSheet";
import AddSummarySheet from "./AddSummarySheet";
import FlashcardDeckForm from "./FlashcardDeckForm";

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
  const [studySubTab, setStudySubTab] = useState<"exams" | "summaries" | "flashcards">("exams");
  const [isNewDeckDialogOpen, setIsNewDeckDialogOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const handleRefresh = async (queryKey: string) => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: [queryKey] });
    setIsRefreshing(false);
  };

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
                  value="study" 
                  className="gap-1.5 px-2 xs:px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-500 data-[state=active]:text-white"
                >
                  <Library className="w-4 h-4 shrink-0" />
                  <span className="hidden xs:inline">Study Materials</span>
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

          {/* Study Materials Tab Content */}
          <TabsContent value="study" className="mt-0">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Study Materials Header */}
              <div className="mb-6">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
                  Study Materials
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Manage your exams, summaries, and flashcards
                </p>
              </div>

              {/* Study Materials Sub-tabs */}
              <div className="flex flex-col gap-6">
                {/* Sub-navigation - Horizontal centered */}
                <div className="flex justify-center gap-2 flex-wrap">
                  <button
                    onClick={() => setStudySubTab("exams")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      studySubTab === "exams"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <FileQuestion className="w-4 h-4" />
                    <span>Exams</span>
                  </button>
                  <button
                    onClick={() => setStudySubTab("summaries")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      studySubTab === "summaries"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <ScrollText className="w-4 h-4" />
                    <span>Summaries</span>
                  </button>
                  <button
                    onClick={() => setStudySubTab("flashcards")}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
                      studySubTab === "flashcards"
                        ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    <span>Flashcards</span>
                  </button>
                </div>

                {/* Study Materials Content Area */}
                <div className="w-full">
                  {studySubTab === "exams" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold">Your Exams</h3>
                          <p className="text-sm text-muted-foreground">
                            Create, take, and review your practice exams
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefresh("exams")}
                            disabled={isRefreshing}
                            className="gap-2"
                          >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                          </Button>
                          <AddExamSheet />
                        </div>
                      </div>
                      <ExamsList />
                    </motion.div>
                  )}

                  {studySubTab === "summaries" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold">Your Summaries</h3>
                          <p className="text-sm text-muted-foreground">
                            AI-generated summaries from your study materials
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefresh("summaries")}
                            disabled={isRefreshing}
                            className="gap-2"
                          >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                          </Button>
                          <AddSummarySheet />
                        </div>
                      </div>
                      <SummariesList />
                    </motion.div>
                  )}

                  {studySubTab === "flashcards" && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                          <h3 className="text-lg font-semibold">Your Flashcard Decks</h3>
                          <p className="text-sm text-muted-foreground">
                            Create and study flashcards with spaced repetition
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRefresh("flashcard-decks")}
                            disabled={isRefreshing}
                            className="gap-2"
                          >
                            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
                            <span className="hidden sm:inline">Refresh</span>
                          </Button>
                          <Dialog open={isNewDeckDialogOpen} onOpenChange={setIsNewDeckDialogOpen}>
                            <DialogTrigger asChild>
                              <Button className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                                <Plus className="w-4 h-4" />
                                New Deck
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Create Flashcard Deck</DialogTitle>
                                <DialogDescription>
                                  Create a new deck to organize your flashcards
                                </DialogDescription>
                              </DialogHeader>
                              <FlashcardDeckForm onSuccess={() => setIsNewDeckDialogOpen(false)} />
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                      <FlashcardDeckList />
                    </motion.div>
                  )}
                </div>
              </div>
            </motion.div>
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
