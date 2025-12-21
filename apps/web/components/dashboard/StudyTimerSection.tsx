"use client";

import { useState } from "react";
import { PomodoroTimer } from "./PomodoroTimer";
import { StudySessionHistory } from "./StudySessionHistory";
import { FocusMode } from "./FocusMode";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { Timer, History, Target } from "lucide-react";
import { GoalProgressCard } from "./GoalProgressCard";
import GoalForm from "./GoalForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function StudyTimerSection() {
  const [isFocusModeOpen, setIsFocusModeOpen] = useState(false);
  const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-8"
    >
      <div className="mb-4">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
          Study Timer
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Focus with Pomodoro technique - 25 minutes of focused study
        </p>
      </div>
      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 mx-auto mb-6">
          <TabsTrigger value="timer" className="gap-2">
            <Timer className="w-4 h-4" />
            Timer
          </TabsTrigger>
          <TabsTrigger value="goals" className="gap-2">
            <Target className="w-4 h-4" />
            Goals
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <History className="w-4 h-4" />
            History
          </TabsTrigger>
        </TabsList>
        <TabsContent value="timer" className="mt-0">
          <div className="flex justify-center">
            <PomodoroTimer onEnterFocusMode={() => setIsFocusModeOpen(true)} />
          </div>
        </TabsContent>
        <TabsContent value="goals" className="mt-0 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Study Goals</h3>
              <p className="text-sm text-muted-foreground">
                Track your daily and weekly study time goals
              </p>
            </div>
            <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Target className="w-4 h-4 mr-2" />
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
                <GoalForm
                  onSuccess={() => {
                    setIsGoalDialogOpen(false);
                  }}
                />
              </DialogContent>
            </Dialog>
          </div>
          <GoalProgressCard />
        </TabsContent>
        <TabsContent value="history" className="mt-0">
          <StudySessionHistory />
        </TabsContent>
      </Tabs>

      {/* Focus Mode Overlay */}
      <FocusMode
        isOpen={isFocusModeOpen}
        onClose={() => setIsFocusModeOpen(false)}
      />
    </motion.div>
  );
}

