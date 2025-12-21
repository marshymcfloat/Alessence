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
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import {
  History,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  AlertCircle,
} from "lucide-react";
import { WrongAnswerReview } from "./WrongAnswerReview";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">{examDescription}</h2>
          <p className="text-sm text-muted-foreground">
            View your exam attempt history and track your progress
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setViewMode("wrong-answers")}
        >
          <AlertCircle className="w-4 h-4 mr-2" />
          Review Wrong Answers
        </Button>
      </div>

      {/* Comparison Chart */}
      {comparison.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-lg font-semibold">Score Trends</h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={comparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="attemptNumber"
                label={{ value: "Attempt", position: "insideBottom", offset: -5 }}
              />
              <YAxis
                domain={[0, 100]}
                label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "0.5rem",
                }}
                formatter={(value: number) => [`${value}%`, "Score"]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 6 }}
                activeDot={{ r: 8 }}
                name="Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* History List */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Attempt History ({history.length})
          </h3>
        </div>

        {loadingHistory ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : history.length > 0 ? (
          <div className="space-y-3">
            {history.map((attempt, index) => (
              <motion.div
                key={attempt.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant="outline">Attempt #{history.length - index}</Badge>
                        <Badge
                          variant={
                            attempt.score >= 70
                              ? "default"
                              : attempt.score >= 50
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {attempt.score.toFixed(1)}%
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(attempt.completedAt), "MMM dd, yyyy 'at' h:mm a")}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          {attempt.correctAnswers}/{attempt.totalQuestions} correct
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedAttempt(attempt.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Review
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No attempt history yet. Complete an exam to see your progress here.
            </p>
          </div>
        )}
      </Card>

      {/* Attempt Details Dialog */}
      <Dialog
        open={selectedAttempt !== null}
        onOpenChange={(open) => !open && setSelectedAttempt(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {attemptDetails?.success && attemptDetails.data && (
            <>
              <DialogHeader>
                <DialogTitle>Attempt Review</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Score</p>
                    <p className="text-2xl font-bold">
                      {attemptDetails.data.score?.toFixed(1)}%
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Correct Answers
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        attemptDetails.data.questions.filter(
                          (q: any) => q.isCorrect
                        ).length
                      }
                      /{attemptDetails.data.questions.length}
                    </p>
                  </Card>
                  <Card className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">
                      Completed
                    </p>
                    <p className="text-sm font-medium">
                      {attemptDetails.data.completedAt
                        ? format(
                            parseISO(attemptDetails.data.completedAt),
                            "MMM dd, yyyy 'at' h:mm a"
                          )
                        : "N/A"}
                    </p>
                  </Card>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Questions & Answers</h4>
                  {attemptDetails.data.questions.map((question: any, idx: number) => (
                    <Card
                      key={question.id}
                      className={`p-4 ${
                        question.isCorrect
                          ? "border-green-500"
                          : "border-red-500"
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        {question.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="font-medium mb-2">
                            Question {idx + 1}: {question.text}
                          </p>
                          {question.type === "MULTIPLE_CHOICE" && (
                            <div className="space-y-1 mb-2">
                              {(question.options as string[]).map(
                                (option: string, optIdx: number) => (
                                  <div
                                    key={optIdx}
                                    className={`p-2 rounded ${
                                      option === question.correctAnswer
                                        ? "bg-green-100 dark:bg-green-900/20"
                                        : option === question.userAnswer &&
                                            !question.isCorrect
                                          ? "bg-red-100 dark:bg-red-900/20"
                                          : "bg-muted"
                                    }`}
                                  >
                                    {option}
                                    {option === question.correctAnswer && (
                                      <Badge className="ml-2" variant="default">
                                        Correct
                                      </Badge>
                                    )}
                                    {option === question.userAnswer &&
                                      !question.isCorrect && (
                                        <Badge
                                          className="ml-2"
                                          variant="destructive"
                                        >
                                          Your Answer
                                        </Badge>
                                      )}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                          {question.userAnswer && (
                            <p className="text-sm text-muted-foreground">
                              Your answer:{" "}
                              <span className="font-medium">
                                {question.userAnswer}
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

