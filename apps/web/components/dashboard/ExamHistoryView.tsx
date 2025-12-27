"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getExamHistory,
  getExamComparison,
  getAttemptDetails,
  ExamAttemptHistory,
  ExamComparisonData,
} from "@/lib/actions/examHistoryActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import {
  History,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
  Trophy,
  Target,
  BarChart3,
  Calendar,
} from "lucide-react";
import { WrongAnswerReview } from "./WrongAnswerReview";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExamHistoryViewProps {
  examId: number;
  examDescription: string;
}

export function ExamHistoryView({
  examId,
  examDescription,
}: ExamHistoryViewProps) {
  const [selectedAttempt, setSelectedAttempt] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"history" | "wrong-answers">(
    "history"
  );

  const { data: historyData, isLoading: loadingHistory } = useQuery({
    queryKey: ["exam-history", examId],
    queryFn: () => getExamHistory(examId),
  });

  const { data: comparisonData, isLoading: loadingComparison } = useQuery({
    queryKey: ["exam-comparison", examId],
    queryFn: () => getExamComparison(examId),
  });

  const { data: attemptDetails } = useQuery({
    queryKey: ["attempt-details", selectedAttempt],
    queryFn: () => getAttemptDetails(selectedAttempt!),
    enabled: selectedAttempt !== null,
  });

  const history = historyData?.success ? historyData.data || [] : [];
  const comparison = comparisonData?.success ? comparisonData.data || [] : [];

  // Calculate stats
  const averageScore =
    history.length > 0
      ? history.reduce((sum, h) => sum + h.score, 0) / history.length
      : 0;
  const bestScore =
    history.length > 0 ? Math.max(...history.map((h) => h.score)) : 0;
  const latestScore = history.length > 0 ? history[0]?.score || 0 : 0;
  const improvement =
    history.length > 1
      ? latestScore - (history[history.length - 1]?.score || 0)
      : 0;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (viewMode === "wrong-answers") {
    return (
      <WrongAnswerReview
        examId={examId}
        examDescription={examDescription}
        onBack={() => setViewMode("history")}
      />
    );
  }

  return (
    <div className="!space-y-8">
      {/* Header */}
      <div className="!flex !items-start !justify-between !gap-6">
        <div className="!flex-1">
          <h2 className="!text-2xl !font-bold !mb-2 !leading-tight">
            {examDescription}
          </h2>
          <p className="!text-sm !text-muted-foreground">
            Track your progress and review past attempts
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setViewMode("wrong-answers")}
          className="!shrink-0 !gap-2"
        >
          <AlertCircle className="!w-4 !h-4" />
          Review Wrong Answers
        </Button>
      </div>

      {/* Stats Cards */}
      {history.length > 0 && (
        <div className="!grid !grid-cols-2 md:!grid-cols-4 !gap-4">
          <Card className="!p-5 !bg-gradient-to-br !from-blue-50 !to-blue-100/50 dark:!from-blue-950/30 dark:!to-blue-900/20 !border-blue-200/50 dark:!border-blue-800/30">
            <div className="!flex !items-center !gap-3">
              <div className="!p-2.5 !rounded-xl !bg-blue-500/10">
                <BarChart3 className="!w-5 !h-5 !text-blue-600 dark:!text-blue-400" />
              </div>
              <div>
                <p className="!text-xs !text-muted-foreground !font-medium !uppercase !tracking-wider">
                  Total Attempts
                </p>
                <p className="!text-2xl !font-bold !text-blue-700 dark:!text-blue-300">
                  {history.length}
                </p>
              </div>
            </div>
          </Card>

          <Card className="!p-5 !bg-gradient-to-br !from-emerald-50 !to-emerald-100/50 dark:!from-emerald-950/30 dark:!to-emerald-900/20 !border-emerald-200/50 dark:!border-emerald-800/30">
            <div className="!flex !items-center !gap-3">
              <div className="!p-2.5 !rounded-xl !bg-emerald-500/10">
                <Trophy className="!w-5 !h-5 !text-emerald-600 dark:!text-emerald-400" />
              </div>
              <div>
                <p className="!text-xs !text-muted-foreground !font-medium !uppercase !tracking-wider">
                  Best Score
                </p>
                <p className="!text-2xl !font-bold !text-emerald-700 dark:!text-emerald-300">
                  {bestScore.toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="!p-5 !bg-gradient-to-br !from-purple-50 !to-purple-100/50 dark:!from-purple-950/30 dark:!to-purple-900/20 !border-purple-200/50 dark:!border-purple-800/30">
            <div className="!flex !items-center !gap-3">
              <div className="!p-2.5 !rounded-xl !bg-purple-500/10">
                <Target className="!w-5 !h-5 !text-purple-600 dark:!text-purple-400" />
              </div>
              <div>
                <p className="!text-xs !text-muted-foreground !font-medium !uppercase !tracking-wider">
                  Average
                </p>
                <p className="!text-2xl !font-bold !text-purple-700 dark:!text-purple-300">
                  {averageScore.toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="!p-5 !bg-gradient-to-br !from-amber-50 !to-amber-100/50 dark:!from-amber-950/30 dark:!to-amber-900/20 !border-amber-200/50 dark:!border-amber-800/30">
            <div className="!flex !items-center !gap-3">
              <div className="!p-2.5 !rounded-xl !bg-amber-500/10">
                {improvement >= 0 ? (
                  <TrendingUp className="!w-5 !h-5 !text-amber-600 dark:!text-amber-400" />
                ) : (
                  <TrendingDown className="!w-5 !h-5 !text-amber-600 dark:!text-amber-400" />
                )}
              </div>
              <div>
                <p className="!text-xs !text-muted-foreground !font-medium !uppercase !tracking-wider">
                  Improvement
                </p>
                <p className="!text-2xl !font-bold !text-amber-700 dark:!text-amber-300">
                  {improvement >= 0 ? "+" : ""}
                  {improvement.toFixed(0)}%
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="!grid !grid-cols-1 lg:!grid-cols-5 !gap-6">
        {/* Chart Section - Takes 3 columns */}
        <Card className="lg:!col-span-3 !p-6">
          <div className="!flex !items-center !gap-3 !mb-6">
            <div className="!p-2 !rounded-lg !bg-primary/10">
              <TrendingUp className="!w-5 !h-5 !text-primary" />
            </div>
            <div>
              <h3 className="!text-lg !font-semibold">Score Progression</h3>
              <p className="!text-xs !text-muted-foreground">
                Track your improvement over time
              </p>
            </div>
          </div>

          {comparison.length > 0 ? (
            <div className="!h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={comparison}>
                  <defs>
                    <linearGradient
                      id="scoreGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="hsl(var(--primary))"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="!opacity-30"
                  />
                  <XAxis
                    dataKey="attemptNumber"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: "Attempt #",
                      position: "insideBottom",
                      offset: -5,
                      fontSize: 12,
                    }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    label={{
                      value: "Score %",
                      angle: -90,
                      position: "insideLeft",
                      fontSize: 12,
                    }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload || payload.length === 0) return null;
                      const data = payload[0]?.payload;
                      if (!data) return null;
                      const scoreColor = data.score >= 75 ? "#10B981" : data.score >= 50 ? "#F59E0B" : "#EF4444";
                      return (
                        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[140px]">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Attempt #{data.attemptNumber}</p>
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" style={{ color: scoreColor }} />
                            <span className="text-lg font-bold" style={{ color: scoreColor }}>
                              {data.score.toFixed(1)}%
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {data.correctAnswers}/{data.totalQuestions} correct
                          </p>
                        </div>
                      );
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    fill="url(#scoreGradient)"
                    dot={{
                      r: 5,
                      fill: "hsl(var(--primary))",
                      strokeWidth: 2,
                      stroke: "hsl(var(--background))",
                    }}
                    activeDot={{
                      r: 7,
                      fill: "hsl(var(--primary))",
                      strokeWidth: 3,
                      stroke: "hsl(var(--background))",
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="!h-[280px] !flex !flex-col !items-center !justify-center !text-center">
              <TrendingUp className="!w-12 !h-12 !text-muted-foreground/30 !mb-4" />
              <p className="!text-muted-foreground">
                Complete more attempts to see your progress chart
              </p>
            </div>
          )}
        </Card>

        <Card className="lg:!col-span-2 !p-6 !flex !flex-col">
          <div className="!flex !items-center !gap-3 !mb-6">
            <div className="!p-2 !rounded-lg !bg-primary/10">
              <History className="!w-5 !h-5 !text-primary" />
            </div>
            <div>
              <h3 className="!text-lg !font-semibold">Attempt History</h3>
              <p className="!text-xs !text-muted-foreground">
                {history.length} attempt{history.length !== 1 ? "s" : ""}{" "}
                recorded
              </p>
            </div>
          </div>

          <ScrollArea className="!flex-1 !-mx-2 !px-2">
            {loadingHistory ? (
              <div className="!flex !items-center !justify-center !py-12">
                <div className="!animate-spin !rounded-full !h-8 !w-8 !border-b-2 !border-primary"></div>
              </div>
            ) : history.length > 0 ? (
              <div className="!space-y-3">
                {history.map((attempt, index) => (
                  <motion.div
                    key={attempt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <div
                      className="!p-4 !rounded-xl !border !bg-muted/30 hover:!bg-muted/50 !transition-all !cursor-pointer !group"
                      onClick={() => setSelectedAttempt(attempt.id)}
                    >
                      <div className="!flex !items-center !justify-between !gap-3">
                        <div className="!flex-1 !min-w-0">
                          <div className="!flex !items-center !gap-2 !mb-2">
                            <span className="!text-xs !font-medium !text-muted-foreground !bg-muted !px-2 !py-0.5 !rounded">
                              #{history.length - index}
                            </span>
                            <Badge
                              variant={
                                attempt.score >= 70
                                  ? "default"
                                  : attempt.score >= 50
                                    ? "secondary"
                                    : "destructive"
                              }
                              className="!text-sm !font-bold"
                            >
                              {attempt.score.toFixed(0)}%
                            </Badge>
                          </div>
                          <div className="!flex !items-center !gap-3 !text-xs !text-muted-foreground">
                            <span className="!flex !items-center !gap-1">
                              <Calendar className="!w-3 !h-3" />
                              {format(
                                parseISO(attempt.completedAt),
                                "MMM dd, yyyy"
                              )}
                            </span>
                            <span className="!flex !items-center !gap-1">
                              <CheckCircle2 className="!w-3 !h-3 !text-green-500" />
                              {attempt.correctAnswers}/{attempt.totalQuestions}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="!opacity-0 group-hover:!opacity-100 !transition-opacity !shrink-0"
                        >
                          <Eye className="!w-4 !h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="!text-center !py-12">
                <History className="!w-12 !h-12 !mx-auto !text-muted-foreground/30 !mb-4" />
                <p className="!text-sm !text-muted-foreground">
                  No attempts yet. Start taking the exam to see your history.
                </p>
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Attempt Details Dialog */}
      <Dialog
        open={selectedAttempt !== null}
        onOpenChange={(open) => !open && setSelectedAttempt(null)}
      >
        <DialogContent
          className="overflow-y-auto"
          style={{ maxWidth: "90vw", width: "1000px", maxHeight: "90vh" }}
        >
          <DialogHeader>
            <DialogTitle className="!text-xl !font-bold">
              Attempt Review
            </DialogTitle>
          </DialogHeader>
          {attemptDetails?.success && attemptDetails.data && (
            <div className="!space-y-6 !mt-4">
              {/* Stats */}
              <div className="!grid !grid-cols-3 !gap-4">
                <Card className="!p-4 !bg-gradient-to-br !from-blue-50 !to-blue-100/50 dark:!from-blue-950/30 dark:!to-blue-900/20">
                  <p className="!text-xs !text-muted-foreground !mb-1 !font-medium">
                    Score
                  </p>
                  <p className="!text-3xl !font-bold !text-blue-700 dark:!text-blue-300">
                    {attemptDetails.data.score?.toFixed(1)}%
                  </p>
                </Card>
                <Card className="!p-4 !bg-gradient-to-br !from-emerald-50 !to-emerald-100/50 dark:!from-emerald-950/30 dark:!to-emerald-900/20">
                  <p className="!text-xs !text-muted-foreground !mb-1 !font-medium">
                    Correct Answers
                  </p>
                  <p className="!text-3xl !font-bold !text-emerald-700 dark:!text-emerald-300">
                    {
                      attemptDetails.data.questions.filter(
                        (q: any) => q.isCorrect
                      ).length
                    }
                    <span className="!text-lg !font-normal !text-muted-foreground">
                      /{attemptDetails.data.questions.length}
                    </span>
                  </p>
                </Card>
                <Card className="!p-4 !bg-gradient-to-br !from-purple-50 !to-purple-100/50 dark:!from-purple-950/30 dark:!to-purple-900/20">
                  <p className="!text-xs !text-muted-foreground !mb-1 !font-medium">
                    Completed
                  </p>
                  <p className="!text-sm !font-semibold !text-purple-700 dark:!text-purple-300">
                    {attemptDetails.data.completedAt
                      ? format(
                          parseISO(attemptDetails.data.completedAt),
                          "MMM dd, yyyy 'at' h:mm a"
                        )
                      : "N/A"}
                  </p>
                </Card>
              </div>

              {/* Questions */}
              <div className="!space-y-4">
                <h4 className="!font-semibold !text-lg">Questions & Answers</h4>
                <div className="!space-y-4">
                  {attemptDetails.data.questions.map(
                    (question: any, idx: number) => (
                      <Card
                        key={question.id}
                        className={`!p-5 !border-l-4 ${
                          question.isCorrect
                            ? "!border-l-green-500 !bg-green-50/50 dark:!bg-green-950/10"
                            : "!border-l-red-500 !bg-red-50/50 dark:!bg-red-950/10"
                        }`}
                      >
                        <div className="!flex !items-start !gap-4">
                          <div className="!shrink-0 !mt-0.5">
                            {question.isCorrect ? (
                              <div className="!p-1.5 !rounded-full !bg-green-100 dark:!bg-green-900/30">
                                <CheckCircle2 className="!w-5 !h-5 !text-green-600 dark:!text-green-400" />
                              </div>
                            ) : (
                              <div className="!p-1.5 !rounded-full !bg-red-100 dark:!bg-red-900/30">
                                <XCircle className="!w-5 !h-5 !text-red-600 dark:!text-red-400" />
                              </div>
                            )}
                          </div>
                          <div className="!flex-1 !min-w-0">
                            <p className="!font-medium !mb-3">
                              <span className="!text-muted-foreground">
                                Q{idx + 1}.
                              </span>{" "}
                              {question.text}
                            </p>
                            {question.type === "MULTIPLE_CHOICE" && (
                              <div className="!space-y-2 !mb-3">
                                {(question.options as string[]).map(
                                  (option: string, optIdx: number) => (
                                    <div
                                      key={optIdx}
                                      className={`!p-3 !rounded-lg !text-sm ${
                                        option === question.correctAnswer
                                          ? "!bg-green-100 dark:!bg-green-900/30 !border !border-green-300 dark:!border-green-700"
                                          : option === question.userAnswer &&
                                              !question.isCorrect
                                            ? "!bg-red-100 dark:!bg-red-900/30 !border !border-red-300 dark:!border-red-700"
                                            : "!bg-muted/50"
                                      }`}
                                    >
                                      <div className="!flex !items-center !justify-between">
                                        <span>{option}</span>
                                        <div className="!flex !gap-2">
                                          {option ===
                                            question.correctAnswer && (
                                            <Badge
                                              variant="default"
                                              className="!text-xs"
                                            >
                                              Correct
                                            </Badge>
                                          )}
                                          {option === question.userAnswer &&
                                            !question.isCorrect && (
                                              <Badge
                                                variant="destructive"
                                                className="!text-xs"
                                              >
                                                Your Answer
                                              </Badge>
                                            )}
                                        </div>
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                            {question.type !== "MULTIPLE_CHOICE" &&
                              question.userAnswer && (
                                <div className="!p-3 !rounded-lg !bg-muted/50 !text-sm">
                                  <span className="!text-muted-foreground">
                                    Your answer:{" "}
                                  </span>
                                  <span className="!font-medium">
                                    {question.userAnswer}
                                  </span>
                                </div>
                              )}
                          </div>
                        </div>
                      </Card>
                    )
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
