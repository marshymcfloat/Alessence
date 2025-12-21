"use client";

import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ExamTimerProps {
  timeLimitMinutes: number;
  onTimeUp: () => void;
  startedAt: Date;
}

export function ExamTimer({
  timeLimitMinutes,
  onTimeUp,
  startedAt,
}: ExamTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(
    timeLimitMinutes * 60
  );
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Calculate initial time remaining based on when exam started
    const elapsed = Math.floor((Date.now() - startedAt.getTime()) / 1000);
    const remaining = Math.max(0, timeLimitMinutes * 60 - elapsed);
    setTimeRemaining(remaining);

    // Update warning states
    setIsWarning(remaining <= 300 && remaining > 60); // 5 minutes
    setIsCritical(remaining <= 60); // 1 minute

    // Set up interval to update timer
    intervalRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = Math.max(0, prev - 1);

        // Update warning states
        setIsWarning(newTime <= 300 && newTime > 60);
        setIsCritical(newTime <= 60);

        // Trigger time up callback
        if (newTime === 0) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
          }
          onTimeUp();
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [timeLimitMinutes, startedAt, onTimeUp]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const percentage = (timeRemaining / (timeLimitMinutes * 60)) * 100;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        <Card
          className={cn(
            "p-4 border-2 transition-all",
            isCritical
              ? "border-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse"
              : isWarning
                ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20"
                : "border-primary/20"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock
                className={cn(
                  "w-5 h-5",
                  isCritical
                    ? "text-red-600"
                    : isWarning
                      ? "text-orange-600"
                      : "text-primary"
                )}
              />
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    isCritical
                      ? "text-red-700 dark:text-red-400"
                      : isWarning
                        ? "text-orange-700 dark:text-orange-400"
                        : "text-muted-foreground"
                  )}
                >
                  Time Remaining
                </p>
                <p
                  className={cn(
                    "text-2xl font-bold font-mono",
                    isCritical
                      ? "text-red-600"
                      : isWarning
                        ? "text-orange-600"
                        : "text-primary"
                  )}
                >
                  {formatTime(timeRemaining)}
                </p>
              </div>
            </div>
            {isCritical && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Time Almost Up!</span>
              </div>
            )}
          </div>
          {/* Progress bar */}
          <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className={cn(
                "h-full transition-colors",
                isCritical
                  ? "bg-red-500"
                  : isWarning
                    ? "bg-orange-500"
                    : "bg-primary"
              )}
              initial={{ width: "100%" }}
              animate={{ width: `${percentage}%` }}
              transition={{ duration: 1, ease: "linear" }}
            />
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
}

