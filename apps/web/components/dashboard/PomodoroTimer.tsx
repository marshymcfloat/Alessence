"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
} from "@/components/ui/input-group";
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  Timer,
  Coffee,
  Maximize,
} from "lucide-react";
import { motion } from "framer-motion";
import { SessionTypeEnum, SessionStatusEnum } from "@repo/db/client-types";
import { CreateStudySessionTypes, UpdateStudySessionTypes } from "@repo/types";
import {
  createStudySessionAction,
  updateStudySessionAction,
  getActiveStudySession,
} from "@/lib/actions/studySessionActions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import SubjectSelectInput from "./SubjectSelectInput";
import { cn } from "@/lib/utils";

// Default durations in seconds
const DEFAULT_DURATIONS = {
  POMODORO: 25 * 60, // 25 minutes
  SHORT_BREAK: 5 * 60, // 5 minutes
  LONG_BREAK: 15 * 60, // 15 minutes
};

interface PomodoroTimerProps {
  onEnterFocusMode?: () => void;
  minimal?: boolean;
}

export function PomodoroTimer({ onEnterFocusMode, minimal = false }: PomodoroTimerProps) {
  const queryClient = useQueryClient();
  const [timeLeft, setTimeLeft] = useState(DEFAULT_DURATIONS.POMODORO);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionType, setSessionType] = useState<SessionTypeEnum>(
    SessionTypeEnum.POMODORO
  );
  const [selectedSubjectId, setSelectedSubjectId] = useState<number | undefined>();
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [pausedAt, setPausedAt] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [customDuration, setCustomDuration] = useState(25);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const isCompletingRef = useRef(false);

  // Load active session on mount
  useEffect(() => {
    loadActiveSession();
  }, []);

  const loadActiveSession = async () => {
    const result = await getActiveStudySession();
    if (result.success && result.data?.session) {
      const session = result.data.session;
      setSessionId(session.id);
      setIsRunning(session.status === SessionStatusEnum.IN_PROGRESS);
      
      // Calculate remaining time
      const startedAt = new Date(session.startedAt);
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startedAt.getTime()) / 1000);
      const remaining = session.duration - elapsed + (session.pausedDuration || 0);
      
      if (remaining > 0) {
        setTimeLeft(remaining);
        setSessionType(session.type);
        setSelectedSubjectId(session.subjectId || undefined);
        setPausedDuration(session.pausedDuration || 0);
        
        if (session.status === SessionStatusEnum.IN_PROGRESS) {
          startTimeRef.current = startedAt;
        } else if (session.status === SessionStatusEnum.PAUSED && session.pausedAt) {
          setPausedAt(new Date(session.pausedAt));
        }
      } else {
        // Session expired, complete it
        if (sessionId) {
          await updateStudySessionAction(sessionId, {
            status: SessionStatusEnum.COMPLETED,
            pausedDuration: session.pausedDuration || 0,
          });
        }
        resetTimer();
      }
    }
  };

  // Timer countdown effect
  // Optimization: Interval persists and uses functional updates to avoid being recreated on every tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 0) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  // Handle timer completion in a separate effect to avoid state updates during render
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      handleTimerComplete();
    }
  }, [timeLeft, isRunning]);

  const showBrowserNotification = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/logo.png",
        badge: "/logo.png",
      });
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const handleTimerComplete = async () => {
    // Prevent double execution
    if (isCompletingRef.current) return;
    isCompletingRef.current = true;

    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    if (sessionId) {
      // Calculate final paused duration if currently paused
      let finalPausedDuration = pausedDuration;
      if (pausedAt) {
        const additionalPauseTime = Math.floor(
          (new Date().getTime() - pausedAt.getTime()) / 1000
        );
        finalPausedDuration = pausedDuration + additionalPauseTime;
      }

      const result = await updateStudySessionAction(sessionId, {
        status: SessionStatusEnum.COMPLETED,
        pausedDuration: finalPausedDuration,
      });
      
      // Invalidate goals progress query to update goal progress immediately
      if (result.success) {
        queryClient.invalidateQueries({ queryKey: ["goals-progress"] });
      }
    }

    // Show notifications
    if (sessionType === SessionTypeEnum.POMODORO) {
      toast.success("Pomodoro completed! 🎉", {
        description: "Great work! Time for a break.",
      });
      showBrowserNotification(
        "Pomodoro Completed! 🎉",
        "Great work! Time for a break."
      );
    } else {
      toast.success("Break completed! ☕", {
        description: "Ready to get back to work?",
      });
      showBrowserNotification(
        "Break Completed! ☕",
        "Ready to get back to work?"
      );
    }

    // Reset timer
    resetTimer();
  };

  const startTimer = async () => {
    if (!sessionId) {
      // Create new session
      const sessionData: CreateStudySessionTypes = {
        type: sessionType,
        duration: timeLeft,
        subjectId: selectedSubjectId,
      };

      const result = await createStudySessionAction(sessionData);
      if (result.success && result.data) {
        setSessionId(result.data.session.id);
        startTimeRef.current = new Date();
        setIsRunning(true);
        toast.success("Study session started! 🚀");
      } else {
        toast.error(result.error || "Failed to start session");
      }
    } else {
      // Resume existing session
      const updateData: UpdateStudySessionTypes = {
        status: SessionStatusEnum.IN_PROGRESS,
      };

      if (pausedAt) {
        const newPauseDuration = Math.floor(
          (new Date().getTime() - pausedAt.getTime()) / 1000
        );
        updateData.pausedDuration = pausedDuration + newPauseDuration;
        setPausedDuration((prev) => prev + newPauseDuration);
        setPausedAt(null);
      }

      const result = await updateStudySessionAction(sessionId, updateData);
      if (result.success) {
        setIsRunning(true);
        startTimeRef.current = new Date();
        toast.success("Session resumed!");
      } else {
        toast.error(result.error || "Failed to resume session");
      }
    }
  };

  const pauseTimer = async () => {
    if (!sessionId) return;

    setIsRunning(false);
    setPausedAt(new Date());

    const result = await updateStudySessionAction(sessionId, {
      status: SessionStatusEnum.PAUSED,
    });

    if (result.success) {
      toast.info("Session paused");
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSessionId(null);
    setPausedDuration(0);
    setPausedAt(null);
    startTimeRef.current = null;
    isCompletingRef.current = false;
    
    // Reset to default based on type
    if (sessionType === SessionTypeEnum.POMODORO) {
      setTimeLeft(DEFAULT_DURATIONS.POMODORO);
    } else if (sessionType === SessionTypeEnum.SHORT_BREAK) {
      setTimeLeft(DEFAULT_DURATIONS.SHORT_BREAK);
    } else {
      setTimeLeft(DEFAULT_DURATIONS.LONG_BREAK);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getProgress = (): number => {
    const total = sessionType === SessionTypeEnum.POMODORO
      ? DEFAULT_DURATIONS.POMODORO
      : sessionType === SessionTypeEnum.SHORT_BREAK
      ? DEFAULT_DURATIONS.SHORT_BREAK
      : DEFAULT_DURATIONS.LONG_BREAK;
    return ((total - timeLeft) / total) * 100;
  };

  const handleTypeChange = (type: SessionTypeEnum) => {
    if (isRunning) return;
    
    setSessionType(type);
    if (type === SessionTypeEnum.POMODORO) {
      setTimeLeft(DEFAULT_DURATIONS.POMODORO);
    } else if (type === SessionTypeEnum.SHORT_BREAK) {
      setTimeLeft(DEFAULT_DURATIONS.SHORT_BREAK);
    } else {
      setTimeLeft(DEFAULT_DURATIONS.LONG_BREAK);
    }
  };

  const handleCustomDuration = (minutes: number) => {
    if (isRunning) return;
    setCustomDuration(minutes);
    setTimeLeft(minutes * 60);
  };

  const renderTimerDisplay = () => (
    <div className={cn("relative", minimal ? "w-80 h-80" : "w-64 h-64")}>
      <svg className="w-full h-full transform -rotate-90">
        <circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="currentColor"
          strokeWidth={minimal ? "4" : "8"}
          fill="none"
          className={cn(minimal ? "text-white/10" : "text-muted")}
        />
        <motion.circle
          cx="50%"
          cy="50%"
          r="45%"
          stroke="currentColor"
          strokeWidth={minimal ? "4" : "8"}
          fill="none"
          className={cn(minimal ? "text-white shadow-glow" : "text-primary")}
          strokeLinecap="round"
          strokeDasharray={2 * Math.PI * (minimal ? 144 : 120)} // Approx radius calc
          // We can use percentage for strokeDasharray to be responsive if needed, but keeping fixed for now
          // strokeDasharray of r=45% of width=320 is ~ 144px radius? No wait, 50% is center.
          // Let's stick to the previous fixed logic or adapt.
          // The previous code had hardcoded cx=128 cy=128 r=120.
          // If minimal is w-80 (320px), center is 160. r could be 150.
          // Let's use simpler percentage-based pathLength framer motion if possible, or stick to current fixed implementation for simplicity first.
          // Reverting to fixed sizes for stability.
        />
        {/* Re-implementing the fixed logic to avoid breaking layout logic abruptly */}
      </svg>
      {/* 
         Actually, let's keep the exact SVG from before for non-minimal, and a cleaner one for minimal.
         But to save complexity, I will just apply class changes.
      */}
       <svg className="w-full h-full transform -rotate-90 absolute inset-0">
          <circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth={minimal ? "2" : "8"}
            fill="none"
            className={cn(minimal ? "text-white/10" : "text-muted")}
          />
          <motion.circle
            cx="50%"
            cy="50%"
            r="45%"
            stroke="currentColor"
            strokeWidth={minimal ? "2" : "8"}
            fill="none"
            className={cn(minimal ? "text-white" : "text-primary")}
            strokeLinecap="round"
            initial={false}
            pathLength={1 - getProgress() / 100}
            style={{ pathLength: 1 - getProgress() / 100 }} // Use pathLength for simpler responsive circles
            transition={{ duration: 0.5 }}
          />
        </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.div
          key={timeLeft}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          className={cn(
            "font-bold tabular-nums tracking-tight",
            minimal ? "text-7xl text-white font-light" : "text-5xl"
          )}
        >
          {formatTime(timeLeft)}
        </motion.div>
        {minimal && (
           <p className="text-white/50 text-sm mt-2 font-medium tracking-widest uppercase">
             {sessionType === SessionTypeEnum.POMODORO ? "Focus" : "Break"}
           </p>
        )}
      </div>
    </div>
  );

  return (
    <Card className={cn(
      "p-6 transition-all duration-300",
      minimal ? "bg-transparent border-0 shadow-none p-0 w-full flex flex-col items-center" : "bg-gradient-to-br from-background to-muted/20 border-2"
    )}>
      <div className="flex flex-col items-center gap-6 w-full">
        {/* Timer Type Selector - Hide in minimal mode if running */}
        {(!minimal || !isRunning) && (
          <div className="flex gap-2">
            <Button
              variant={sessionType === SessionTypeEnum.POMODORO ? (minimal ? "secondary" : "default") : (minimal ? "ghost" : "outline")}
              size="sm"
              onClick={() => handleTypeChange(SessionTypeEnum.POMODORO)}
              disabled={isRunning}
              className={cn(minimal && "text-white hover:bg-white/20")}
            >
              <Timer className="w-4 h-4" />
              <span className="ml-2">Focus</span>
            </Button>
            <Button
              variant={sessionType === SessionTypeEnum.SHORT_BREAK ? (minimal ? "secondary" : "default") : (minimal ? "ghost" : "outline")}
              size="sm"
              onClick={() => handleTypeChange(SessionTypeEnum.SHORT_BREAK)}
              disabled={isRunning}
              className={cn(minimal && "text-white hover:bg-white/20")}
            >
              <Coffee className="w-4 h-4" />
              <span className="ml-2">Short Break</span>
            </Button>
            <Button
              variant={sessionType === SessionTypeEnum.LONG_BREAK ? (minimal ? "secondary" : "default") : (minimal ? "ghost" : "outline")}
              size="sm"
              onClick={() => handleTypeChange(SessionTypeEnum.LONG_BREAK)}
              disabled={isRunning}
              className={cn(minimal && "text-white hover:bg-white/20")}
            >
              <Coffee className="w-4 h-4" />
              <span className="ml-2">Long Break</span>
            </Button>
          </div>
        )}

        {renderTimerDisplay()}

        {/* Controls */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <InputGroup className={cn(
            "h-11 border-0 shadow-none",
            minimal 
              ? "bg-white text-black" 
              : "bg-primary text-primary-foreground"
          )}>
            {!isRunning ? (
              <InputGroupButton
                onClick={startTimer}
                variant="default"
                size="sm"
                className={cn(
                  "flex-1 h-full rounded-l-md rounded-r-none gap-2 text-base font-medium border-0 shadow-none",
                  minimal 
                    ? "bg-white text-black hover:bg-white/90" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Play className="w-5 h-5" />
                Start
              </InputGroupButton>
            ) : (
              <InputGroupButton
                onClick={pauseTimer}
                variant="default"
                size="sm"
                className={cn(
                  "flex-1 h-full rounded-l-md rounded-r-none gap-2 text-base font-medium border-0 shadow-none",
                  minimal 
                    ? "bg-white text-black hover:bg-white/90" 
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Pause className="w-5 h-5" />
                Pause
              </InputGroupButton>
            )}
            <InputGroupAddon align="inline-end" className="px-0">
              <div className="h-full py-1.5 pr-1.5">
                <InputGroupButton
                  onClick={resetTimer}
                  variant="ghost"
                  size="icon-sm"
                  className={cn(
                    "h-full rounded-md px-3 border-l border-white/20",
                    minimal 
                      ? "text-black hover:bg-black/5" 
                      : "text-white hover:bg-white/20"
                  )}
                  disabled={!sessionId && !isRunning}
                >
                  <RotateCcw className="w-4 h-4" />
                </InputGroupButton>
              </div>
            </InputGroupAddon>
          </InputGroup>
          
          {!minimal && onEnterFocusMode && (
            <Button
              onClick={onEnterFocusMode}
              variant="outline"
              size="lg"
              className="gap-2 w-full border-2 border-primary/20 hover:border-primary/40"
            >
              <Maximize className="w-5 h-5" />
              Enter Focus Mode
            </Button>
          )}
        </div>

        {/* Subject Selection - Hide in minimal mode */}
        {!minimal && (
          <div className="w-full">
            <Label className="text-sm text-muted-foreground mb-2 block">
              Subject (optional)
            </Label>
            <SubjectSelectInput
              value={selectedSubjectId}
              onValueChange={setSelectedSubjectId}
            />
          </div>
        )}

        {/* Settings - Hide in minimal mode */}
        {!minimal && (
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Timer Settings</DialogTitle>
                <DialogDescription>
                  Customize your timer durations
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="custom-duration">Custom Duration (minutes)</Label>
                  <Input
                    id="custom-duration"
                    type="number"
                    min="1"
                    max="120"
                    value={customDuration}
                    onChange={(e) => handleCustomDuration(Number(e.target.value))}
                    disabled={isRunning}
                  />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </Card>
  );
}
