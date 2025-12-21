"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getExamScoreTrends,
  getSubjectPerformance,
  getStudyTimeAnalytics,
  getTaskCompletionRates,
  getWeakAreas,
} from "@/lib/actions/analyticsActions";
import { ExamScoreTrendChart } from "./analytics/ExamScoreTrendChart";
import { SubjectPerformanceChart } from "./analytics/SubjectPerformanceChart";
import { StudyTimeChart } from "./analytics/StudyTimeChart";
import { TaskCompletionChart } from "./analytics/TaskCompletionChart";
import { WeakAreasCard } from "./analytics/WeakAreasCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, TrendingUp, Clock, CheckCircle2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { motion } from "framer-motion";

export function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState<number>(30);

  const { data: scoreTrends, isLoading: loadingTrends } = useQuery({
    queryKey: ["exam-score-trends", timeRange],
    queryFn: () => getExamScoreTrends(timeRange),
  });

  const { data: subjectPerformance, isLoading: loadingPerformance } = useQuery({
    queryKey: ["subject-performance"],
    queryFn: getSubjectPerformance,
  });

  const { data: studyTime, isLoading: loadingStudyTime } = useQuery({
    queryKey: ["study-time", timeRange],
    queryFn: () => getStudyTimeAnalytics(timeRange),
  });

  const { data: taskCompletion, isLoading: loadingTasks } = useQuery({
    queryKey: ["task-completion", timeRange],
    queryFn: () => getTaskCompletionRates(timeRange),
  });

  const { data: weakAreas, isLoading: loadingWeakAreas } = useQuery({
    queryKey: ["weak-areas"],
    queryFn: getWeakAreas,
  });

  const isLoading =
    loadingTrends ||
    loadingPerformance ||
    loadingStudyTime ||
    loadingTasks ||
    loadingWeakAreas;

  // Calculate summary stats
  const totalStudyHours =
    studyTime?.success && studyTime.data?.data
      ? Math.round(
          (studyTime.data.data.reduce((sum, d) => sum + d.duration, 0) /
            3600) *
            100
        ) / 100
      : 0;

  const avgScore =
    scoreTrends?.success && scoreTrends.data?.trends
      ? Math.round(
          (scoreTrends.data.trends.reduce((sum, t) => sum + t.score, 0) /
            scoreTrends.data.trends.length) *
            100
        ) / 100
      : 0;

  const totalTasksCompleted =
    taskCompletion?.success && taskCompletion.data?.data
      ? taskCompletion.data.data.reduce((sum, d) => sum + d.completed, 0)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header with Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
            Performance Dashboard
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track your study progress and performance metrics
          </p>
        </div>
        <Select
          value={timeRange.toString()}
          onValueChange={(value) => setTimeRange(Number(value))}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Average Exam Score
                </p>
                <p className="text-3xl font-bold">
                  {avgScore > 0 ? `${avgScore}%` : "N/A"}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Total Study Time
                </p>
                <p className="text-3xl font-bold">
                  {totalStudyHours > 0 ? `${totalStudyHours}h` : "0h"}
                </p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Tasks Completed
                </p>
                <p className="text-3xl font-bold">{totalTasksCompleted}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scoreTrends?.success && scoreTrends.data?.trends && (
          <ExamScoreTrendChart data={scoreTrends.data.trends} />
        )}

        {subjectPerformance?.success &&
          subjectPerformance.data?.performance && (
            <SubjectPerformanceChart
              data={subjectPerformance.data.performance}
            />
          )}

        {studyTime?.success && studyTime.data?.data && (
          <StudyTimeChart data={studyTime.data.data} />
        )}

        {taskCompletion?.success && taskCompletion.data?.data && (
          <TaskCompletionChart data={taskCompletion.data.data} />
        )}
      </div>

      {/* Weak Areas */}
      {weakAreas?.success && weakAreas.data?.weakAreas && (
        <WeakAreasCard weakAreas={weakAreas.data.weakAreas} />
      )}

      {isLoading && (
        <Card className="p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-4">Loading analytics...</p>
        </Card>
      )}
    </div>
  );
}

