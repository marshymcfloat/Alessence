"use client";

import { motion } from "framer-motion";
import { Timer, Target, History, Plus } from "lucide-react";
import { PomodoroTimer } from "../PomodoroTimer";
import { GoalProgressCard } from "../GoalProgressCard";
import { StudySessionHistory } from "../StudySessionHistory";
import { FocusMode } from "../FocusMode";
import GoalForm from "../GoalForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQueryState } from "@/hooks/use-query-state";

export function TimerTab() {
  const [timerSubTab, setTimerSubTab] = useQueryState("timerView", {
    defaultValue: "timer",
    parse: (value) => value as "timer" | "goals" | "history",
  });
  
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  return (
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
      
      {/* Focus Mode Overlay */}
      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
      />
    </motion.div>
  );
}
