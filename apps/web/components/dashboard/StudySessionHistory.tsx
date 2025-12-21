"use client";

import { useQuery } from "@tanstack/react-query";
import { getAllStudySessions } from "@/lib/actions/studySessionActions";
import type { StudySession } from "@repo/db";
import { SessionTypeEnum, SessionStatusEnum } from "@repo/db/client-types";

type StudySessionWithRelations = StudySession & {
  subject?: { id: number; title: string } | null;
};
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Timer, Coffee, Clock, BookOpen, CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  return `${secs}s`;
}

function getSessionTypeIcon(type: SessionTypeEnum) {
  switch (type) {
    case SessionTypeEnum.POMODORO:
      return <Timer className="w-4 h-4" />;
    case SessionTypeEnum.SHORT_BREAK:
    case SessionTypeEnum.LONG_BREAK:
      return <Coffee className="w-4 h-4" />;
    default:
      return <Clock className="w-4 h-4" />;
  }
}

function getSessionTypeLabel(type: SessionTypeEnum): string {
  switch (type) {
    case SessionTypeEnum.POMODORO:
      return "Focus Session";
    case SessionTypeEnum.SHORT_BREAK:
      return "Short Break";
    case SessionTypeEnum.LONG_BREAK:
      return "Long Break";
    default:
      return "Custom";
  }
}

export function StudySessionHistory() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["study-sessions"],
    queryFn: getAllStudySessions,
  });

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Card>
    );
  }

  if (error || !data?.success || !data.data) {
    return (
      <Card className="p-6">
        <p className="text-sm text-muted-foreground text-center py-4">
          Failed to load study sessions
        </p>
      </Card>
    );
  }

  const sessions = data.data.sessions.filter(
    (s) => s.status === SessionStatusEnum.COMPLETED
  );

  if (sessions.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Clock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground">
            No completed study sessions yet
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Start a timer to track your study time
          </p>
        </div>
      </Card>
    );
  }

  // Calculate total study time
  const totalTime = sessions.reduce((acc, session) => {
    return acc + (session.actualDuration || session.duration);
  }, 0);

  // Group by date
  const sessionsByDate = sessions.reduce((acc, session) => {
    const date = new Date(session.completedAt || session.startedAt);
    const dateKey = date.toDateString();
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(session);
    return acc;
  }, {} as Record<string, StudySessionWithRelations[]>);

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Study Summary</h3>
          <CheckCircle2 className="w-5 h-5 text-primary" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Total Sessions</p>
            <p className="text-2xl font-bold">{sessions.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Time</p>
            <p className="text-2xl font-bold">{formatDuration(totalTime)}</p>
          </div>
        </div>
      </Card>

      {/* Sessions List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Sessions</h3>
        {Object.entries(sessionsByDate)
          .slice(0, 7) // Show last 7 days
          .map(([dateKey, dateSessions]) => (
            <motion.div
              key={dateKey}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-medium text-muted-foreground px-2">
                {dateKey}
              </h4>
              <div className="space-y-2">
                {dateSessions.map((session) => (
                  <Card
                    key={session.id}
                    className="p-4 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getSessionTypeIcon(session.type)}
                        </div>
                        <div>
                          <p className="font-medium">
                            {getSessionTypeLabel(session.type)}
                          </p>
                          {session.subject && (
                            <div className="flex items-center gap-1 mt-1">
                              <BookOpen className="w-3 h-3 text-muted-foreground" />
                              <p className="text-xs text-muted-foreground">
                                {session.subject.title}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {formatDuration(
                            session.actualDuration || session.duration
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(
                            new Date(session.completedAt || session.startedAt),
                            { addSuffix: true }
                          )}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}
      </div>
    </div>
  );
}

