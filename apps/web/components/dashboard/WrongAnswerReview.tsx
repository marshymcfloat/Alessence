"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getWrongAnswers,
  getWrongAnswerStatistics,
  WrongAnswer,
  WrongAnswerStatistics,
} from "@/lib/actions/wrongAnswerActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertCircle,
  TrendingDown,
  RotateCcw,
  CheckCircle2,
  XCircle,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

interface WrongAnswerReviewProps {
  examId: number;
  examDescription: string;
  onBack?: () => void;
}

export function WrongAnswerReview({
  examId,
  examDescription,
  onBack,
}: WrongAnswerReviewProps) {
  const router = useRouter();
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(
    null
  );

  const { data: wrongAnswersData, isLoading: loadingAnswers } = useQuery({
    queryKey: ["wrong-answers", examId],
    queryFn: () => getWrongAnswers(examId),
  });

  const { data: statisticsData } = useQuery({
    queryKey: ["wrong-answer-statistics", examId],
    queryFn: () => getWrongAnswerStatistics(examId),
  });

  const wrongAnswers = wrongAnswersData?.success
    ? wrongAnswersData.data || []
    : [];
  const statistics = statisticsData?.success
    ? statisticsData.data
    : ({} as WrongAnswerStatistics);

  const handleRetryExam = () => {
    router.push(`/dashboard?exam=${examId}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-2">Wrong Answer Review</h2>
          <p className="text-sm text-muted-foreground">{examDescription}</p>
        </div>
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to History
          </Button>
        )}
      </div>

      {/* Statistics */}
      {statistics && Object.keys(statistics).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-muted-foreground">Wrong Questions</p>
            </div>
            <p className="text-2xl font-bold">
              {statistics.uniqueWrongQuestions}/{statistics.totalQuestions}
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingDown className="w-4 h-4 text-orange-500" />
              <p className="text-sm text-muted-foreground">Wrong Rate</p>
            </div>
            <p className="text-2xl font-bold">
              {statistics.wrongAnswerRate.toFixed(1)}%
            </p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <RotateCcw className="w-4 h-4 text-primary" />
              <p className="text-sm text-muted-foreground">Total Attempts</p>
            </div>
            <p className="text-2xl font-bold">{statistics.totalAttempts}</p>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <p className="text-sm text-muted-foreground">Total Mistakes</p>
            </div>
            <p className="text-2xl font-bold">
              {statistics.totalWrongAnswers}
            </p>
          </Card>
        </div>
      )}

      {/* Action Button */}
      <div className="flex justify-end">
        <Button onClick={handleRetryExam}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry Exam
        </Button>
      </div>

      {/* Wrong Answers List */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">
            Questions You Got Wrong ({wrongAnswers.length})
          </h3>
        </div>

        {loadingAnswers ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : wrongAnswers.length > 0 ? (
          <div className="space-y-4">
            {wrongAnswers.map((item, index) => (
              <motion.div
                key={item.question.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`p-4 border-2 ${
                    selectedQuestion === item.question.id
                      ? "border-primary"
                      : "border-red-200 dark:border-red-900/50"
                  } hover:shadow-md transition-all cursor-pointer`}
                  onClick={() =>
                    setSelectedQuestion(
                      selectedQuestion === item.question.id
                        ? null
                        : item.question.id
                    )
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="destructive">
                          Wrong {item.totalWrongAttempts} time
                          {item.totalWrongAttempts !== 1 ? "s" : ""}
                        </Badge>
                        <Badge variant="outline">
                          {item.question.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <h4 className="font-semibold mb-2">
                        {item.question.text}
                      </h4>

                      {selectedQuestion === item.question.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 space-y-3"
                        >
                          {/* Correct Answer */}
                          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-900/50">
                            <div className="flex items-center gap-2 mb-1">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700 dark:text-green-400">
                                Correct Answer:
                              </span>
                            </div>
                            <p className="text-sm text-green-800 dark:text-green-300">
                              {item.question.correctAnswer}
                            </p>
                          </div>

                          {/* Your Wrong Answers */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                              Your incorrect answers:
                            </p>
                            {item.attempts.map((attempt, attemptIdx) => (
                              <div
                                key={attempt.attemptId}
                                className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-900/50"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <XCircle className="w-4 h-4 text-red-600" />
                                    <span className="text-sm font-medium text-red-700 dark:text-red-400">
                                      Attempt #{attempt.attemptNumber}
                                    </span>
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {format(
                                      parseISO(attempt.completedAt),
                                      "MMM dd, yyyy"
                                    )}
                                  </span>
                                </div>
                                <p className="text-sm text-red-800 dark:text-red-300">
                                  {attempt.userAnswer}
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Options (for multiple choice) */}
                          {item.question.type === "MULTIPLE_CHOICE" && (
                            <div className="mt-3">
                              <p className="text-sm font-medium text-muted-foreground mb-2">
                                All options:
                              </p>
                              <div className="space-y-1">
                                {(item.question.options as string[]).map(
                                  (option, optIdx) => (
                                    <div
                                      key={optIdx}
                                      className={`p-2 rounded ${
                                        option === item.question.correctAnswer
                                          ? "bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800"
                                          : item.attempts.some(
                                              (a) => a.userAnswer === option
                                            )
                                            ? "bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-800"
                                            : "bg-muted"
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <span>{option}</span>
                                        {option === item.question.correctAnswer && (
                                          <Badge
                                            variant="default"
                                            className="ml-auto"
                                          >
                                            Correct
                                          </Badge>
                                        )}
                                        {item.attempts.some(
                                          (a) => a.userAnswer === option
                                        ) && (
                                          <Badge
                                            variant="destructive"
                                            className="ml-auto"
                                          >
                                            Your Answer
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
            <p className="text-lg font-semibold mb-2">
              No wrong answers to review!
            </p>
            <p className="text-sm text-muted-foreground">
              Great job! You've answered all questions correctly in your
              attempts.
            </p>
          </div>
        )}
      </Card>
    </div>
  );
}

