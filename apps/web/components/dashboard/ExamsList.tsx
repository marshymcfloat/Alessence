"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAllExams,
  deleteExam,
  getExamById,
} from "@/lib/actions/examActionts";
import {
  startExamAttempt,
  submitExamAttempt,
  abandonExamAttempt,
  StartAttemptResult,
  SubmitAttemptResult,
} from "@/lib/actions/examHistoryActions";
import type { Exam, Question } from "@repo/db";
import { ExamStatusEnum } from "@repo/db/client-types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Trash2,
  LoaderCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Repeat,
  Play,
  Trophy,
  Target,
  Timer,
  AlertTriangle,
  ChevronRight,
  BookOpen,
  Award,
} from "lucide-react";
import { ExamHistoryView } from "./ExamHistoryView";
import { toast } from "sonner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

type ExamWithCount = Exam & {
  subject: { id: number; title: string };
  _count: { questions: number; attempts: number };
  lastAttempt?: {
    id: number;
    score: number;
    completedAt: string;
  } | null;
  attemptCount: number;
};

type QuestionType = {
  id: number;
  text: string;
  type: string;
  options: string[];
};

export default function ExamsList() {
  const queryClient = useQueryClient();

  // React Query for fetching exams
  const {
    data: examsData,
    isLoading: loading,
    refetch,
  } = useQuery({
    queryKey: ["exams"],
    queryFn: () => getAllExams(),
  });

  const exams = examsData?.success
    ? (examsData.data?.exams as ExamWithCount[]) || []
    : [];

  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Exam taking state
  const [isExamDialogOpen, setIsExamDialogOpen] = useState(false);
  const [currentExam, setCurrentExam] = useState<ExamWithCount | null>(null);
  const [currentAttempt, setCurrentAttempt] =
    useState<StartAttemptResult | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<SubmitAttemptResult | null>(
    null
  );
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // History dialog state
  const [viewingHistory, setViewingHistory] = useState<{
    id: number;
    description: string;
  } | null>(null);

  // Confirm dialog hook
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  // Expose refetch for external use
  const loadExams = useCallback(() => {
    refetch();
  }, [refetch]);

  // Timer effect
  useEffect(() => {
    if (!currentAttempt?.timeLimit || !isExamDialogOpen || examResult) return;

    const startTime = new Date(currentAttempt.startedAt).getTime();
    const timeLimitMs = currentAttempt.timeLimit * 60 * 1000;

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const remaining = Math.max(0, timeLimitMs - elapsed);
      setTimeRemaining(Math.floor(remaining / 1000));

      if (remaining <= 0) {
        handleTimeUp();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [currentAttempt, isExamDialogOpen, examResult]);

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirm({
      title: "Delete Exam",
      description:
        "Are you sure you want to delete this exam? This action cannot be undone.",
      confirmText: "Delete",
      cancelText: "Cancel",
      variant: "destructive",
    });

    if (!confirmed) return;

    setDeletingId(id);
    const result = await deleteExam(id);
    setDeletingId(null);

    if (result.success) {
      toast.success("Exam deleted successfully");
      loadExams();
    } else {
      toast.error(result.error || "Failed to delete exam");
    }
  };

  const handleStartExam = async (exam: ExamWithCount) => {
    if (exam.status !== ExamStatusEnum.READY) {
      toast.info("This exam is still being generated. Please wait.");
      return;
    }

    setCurrentExam(exam);
    setAnswers({});
    setExamResult(null);
    setCurrentQuestionIndex(0);

    const result = await startExamAttempt(exam.id);

    if (result.success && result.data) {
      setCurrentAttempt(result.data);
      setIsExamDialogOpen(true);
    } else {
      toast.error(result.error || "Failed to start exam");
    }
  };

  const handleTimeUp = useCallback(async () => {
    if (!currentAttempt || examResult) return;

    toast.warning("Time's up! Submitting your answers...");
    await handleSubmit(true);
  }, [currentAttempt, examResult, answers]);

  const handleAnswerChange = (questionId: number, answer: string) => {
    if (examResult) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = async (autoSubmit = false) => {
    if (!currentExam || !currentAttempt) return;

    const totalQuestions = currentAttempt.questions.length;
    const answeredQuestions = Object.keys(answers).length;

    if (!autoSubmit && answeredQuestions < totalQuestions) {
      const confirmed = await confirm({
        title: "Incomplete Exam",
        description: `You have only answered ${answeredQuestions} out of ${totalQuestions} questions. Submit anyway?`,
        confirmText: "Submit Anyway",
        cancelText: "Continue Exam",
        variant: "default",
      });

      if (!confirmed) {
        return;
      }
    }

    setIsSubmitting(true);

    const answersToSubmit = currentAttempt.questions
      .filter((q) => answers[q.id])
      .map((q) => ({
        questionId: q.id,
        userAnswer: answers[q.id] || "",
      }));

    const result = await submitExamAttempt(
      currentExam.id,
      currentAttempt.attemptId,
      answersToSubmit
    );

    setIsSubmitting(false);

    if (result.success && result.data) {
      setExamResult(result.data);
      toast.success(
        `Score: ${result.data.correctAnswers}/${result.data.totalQuestions} (${result.data.score.toFixed(1)}%)`
      );
      loadExams(); // Refresh to update attempt count
    } else {
      toast.error(result.error || "Failed to submit exam");
    }
  };

  const handleCloseExam = async () => {
    if (currentAttempt && !examResult) {
      const confirmed = await confirm({
        title: "Abandon Exam",
        description:
          "You have an exam in progress. Are you sure you want to abandon it?",
        confirmText: "Abandon",
        cancelText: "Continue Exam",
        variant: "destructive",
      });

      if (confirmed) {
        await abandonExamAttempt(currentAttempt.attemptId);
      } else {
        return;
      }
    }

    setIsExamDialogOpen(false);
    setCurrentExam(null);
    setCurrentAttempt(null);
    setExamResult(null);
    setAnswers({});
    setTimeRemaining(null);
  };

  const handleViewHistory = (exam: ExamWithCount, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingHistory({ id: exam.id, description: exam.description });
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-900/30";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-900/30";
    return "bg-red-100 dark:bg-red-900/30";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <LoaderCircle className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (exams.length === 0) {
    return (
      <div className="rounded-lg mx-auto border border-gray-200 dark:border-gray-800 w-full flex-1 !p-12 bg-white dark:bg-slate-900/50">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText className="!w-12 !h-12 text-gray-400 dark:text-gray-500" />
            </EmptyMedia>
            <EmptyTitle className="!text-lg">No exams yet</EmptyTitle>
            <EmptyDescription className="!text-sm">
              Create your first exam to get started with practice tests.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg mx-auto border border-gray-200 dark:border-gray-800 w-full !p-6 bg-white dark:bg-slate-900/50">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {exams.map((exam) => (
            <motion.div
              key={exam.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="group"
            >
              <Card
                className={cn(
                  "relative overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg",
                  exam.status === ExamStatusEnum.READY
                    ? "border-transparent bg-gradient-to-br from-white to-gray-50 dark:from-slate-800 dark:to-slate-900 hover:border-primary/50"
                    : "opacity-60"
                )}
                onClick={() => handleStartExam(exam)}
              >
                {/* Status indicator bar */}
                <div
                  className={cn(
                    "absolute top-0 left-0 right-0 h-1",
                    exam.status === ExamStatusEnum.READY
                      ? "bg-gradient-to-r from-green-400 to-emerald-500"
                      : exam.status === ExamStatusEnum.GENERATING
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse"
                        : "bg-gradient-to-r from-red-400 to-rose-500"
                  )}
                />

                <div className="p-5">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base text-gray-900 dark:text-white line-clamp-2 mb-1">
                        {exam.description}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {exam.subject.title}
                      </p>
                    </div>

                    {/* Delete button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDelete(exam.id, e)}
                      disabled={deletingId === exam.id}
                      className="shrink-0 h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      {deletingId === exam.id ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Trash2 className="size-4" />
                      )}
                    </Button>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <Badge
                      variant="secondary"
                      className="gap-1 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                    >
                      <BookOpen className="size-3" />
                      {exam._count.questions} questions
                    </Badge>

                    {exam.timeLimit && (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300"
                      >
                        <Timer className="size-3" />
                        {exam.timeLimit} min
                      </Badge>
                    )}

                    {exam.isPracticeMode && (
                      <Badge
                        variant="secondary"
                        className="gap-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
                      >
                        <Repeat className="size-3" />
                        Practice
                      </Badge>
                    )}
                  </div>

                  {/* Attempts and last score */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {exam.attemptCount > 0 ? (
                        <>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Target className="size-4" />
                            <span>
                              {exam.attemptCount} attempt
                              {exam.attemptCount !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {exam.lastAttempt && (
                            <div
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-sm font-medium",
                                getScoreBg(exam.lastAttempt.score),
                                getScoreColor(exam.lastAttempt.score)
                              )}
                            >
                              <Trophy className="size-3.5" />
                              {exam.lastAttempt.score.toFixed(0)}%
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Not attempted yet
                        </span>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {exam.attemptCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => handleViewHistory(exam, e)}
                          className="h-8 gap-1 text-muted-foreground hover:text-primary"
                        >
                          <History className="size-3.5" />
                          History
                        </Button>
                      )}

                      <Button
                        size="sm"
                        className="h-8 gap-1"
                        disabled={exam.status !== ExamStatusEnum.READY}
                      >
                        {exam.status === ExamStatusEnum.GENERATING ? (
                          <>
                            <LoaderCircle className="size-3.5 animate-spin" />
                            Generating...
                          </>
                        ) : exam.status === ExamStatusEnum.READY ? (
                          <>
                            <Play className="size-3.5" />
                            {exam.attemptCount > 0 ? "Retake" : "Start"}
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3.5" />
                            Failed
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Exam Taking Dialog */}
      <Dialog open={isExamDialogOpen} onOpenChange={() => handleCloseExam()}>
        <DialogContent className="!max-w-5xl !max-h-[95vh] !p-0 overflow-hidden">
          <DialogTitle className="sr-only">
            {currentExam?.description || "Exam"}
          </DialogTitle>
          {currentAttempt && currentExam && (
            <div className="flex flex-col h-[90vh]">
              {/* Sticky Header with Timer */}
              <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-lg truncate">
                      {currentExam.description}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {currentExam.subject.title} •{" "}
                      {currentAttempt.questions.length} questions
                    </p>
                  </div>

                  {/* Timer */}
                  {currentAttempt.timeLimit && !examResult && (
                    <div
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-full font-mono text-lg font-bold transition-all",
                        timeRemaining !== null && timeRemaining <= 60
                          ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                          : timeRemaining !== null && timeRemaining <= 300
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
                            : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                      )}
                    >
                      <Clock className="size-5" />
                      {timeRemaining !== null
                        ? formatTime(timeRemaining)
                        : "--:--"}
                    </div>
                  )}

                  {/* Progress */}
                  {!examResult && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {Object.keys(answers).length}/
                        {currentAttempt.questions.length} answered
                      </span>
                      <Progress
                        value={
                          (Object.keys(answers).length /
                            currentAttempt.questions.length) *
                          100
                        }
                        className="w-24 h-2"
                      />
                    </div>
                  )}
                </div>

                {/* Time warning */}
                {timeRemaining !== null &&
                  timeRemaining <= 60 &&
                  !examResult && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 mt-3 p-2 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400 text-sm"
                    >
                      <AlertTriangle className="size-4" />
                      <span>Less than 1 minute remaining!</span>
                    </motion.div>
                  )}
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6">
                {examResult ? (
                  /* Results View */
                  <div className="space-y-6">
                    {/* Score Summary */}
                    <div className="text-center py-8">
                      <div
                        className={cn(
                          "inline-flex items-center justify-center w-32 h-32 rounded-full mb-4",
                          getScoreBg(examResult.score)
                        )}
                      >
                        <div className="text-center">
                          <Award
                            className={cn(
                              "size-10 mx-auto mb-1",
                              getScoreColor(examResult.score)
                            )}
                          />
                          <span
                            className={cn(
                              "text-3xl font-bold",
                              getScoreColor(examResult.score)
                            )}
                          >
                            {examResult.score.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        Exam Complete!
                      </h3>
                      <p className="text-muted-foreground">
                        You got {examResult.correctAnswers} out of{" "}
                        {examResult.totalQuestions} questions correct in{" "}
                        {Math.floor(examResult.timeTaken / 60)}m{" "}
                        {examResult.timeTaken % 60}s
                      </p>
                    </div>

                    {/* Question Results */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {currentAttempt.questions.map((question, index) => {
                        const result = examResult.results.find(
                          (r) => r.questionId === question.id
                        );
                        const userAnswer = answers[question.id];

                        return (
                          <Card
                            key={question.id}
                            className={cn(
                              "p-4 border-2",
                              result?.isCorrect
                                ? "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-900/20"
                                : "border-red-300 bg-red-50 dark:border-red-700 dark:bg-red-900/20"
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={cn(
                                  "shrink-0 w-6 h-6 rounded-full flex items-center justify-center",
                                  result?.isCorrect
                                    ? "bg-green-500 text-white"
                                    : "bg-red-500 text-white"
                                )}
                              >
                                {result?.isCorrect ? (
                                  <CheckCircle2 className="size-4" />
                                ) : (
                                  <XCircle className="size-4" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm mb-2 line-clamp-2">
                                  {index + 1}. {question.text}
                                </p>
                                {userAnswer && (
                                  <p className="text-xs text-muted-foreground">
                                    Your answer:{" "}
                                    <span
                                      className={
                                        result?.isCorrect
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }
                                    >
                                      {userAnswer}
                                    </span>
                                  </p>
                                )}
                                {!result?.isCorrect &&
                                  result?.correctAnswer && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                      Correct: {result.correctAnswer}
                                    </p>
                                  )}
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ) : /* Questions View */
                currentAttempt.questions.length === 0 ? (
                  <div className="text-center p-8 text-muted-foreground">
                    No questions available.
                  </div>
                ) : (
                  <div className="!grid !grid-cols-1 md:!grid-cols-2 !gap-6 !w-full !max-w-5xl !mx-auto">
                    {currentAttempt.questions.map((question, index) => {
                      const options = (question.options as string[]) || [];
                      const userAnswer = answers[question.id];
                      const isIdentification =
                        question.type === "IDENTIFICATION";
                      const isTrueFalse = question.type === "TRUE_FALSE";

                      return (
                        <Card
                          key={question.id}
                          className={cn(
                            "p-5 transition-all border-2",
                            userAnswer
                              ? "border-primary/30 bg-primary/5"
                              : "border-gray-200 dark:border-gray-700"
                          )}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <span
                              className={cn(
                                "shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
                                userAnswer
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-gray-200 dark:bg-gray-700 text-muted-foreground"
                              )}
                            >
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white leading-relaxed">
                                {question.text}
                              </p>
                              <Badge variant="outline" className="mt-2 text-xs">
                                {question.type.replace("_", " ").toLowerCase()}
                              </Badge>
                            </div>
                          </div>

                          {isIdentification ? (
                            <input
                              type="text"
                              value={userAnswer || ""}
                              onChange={(e) =>
                                handleAnswerChange(question.id, e.target.value)
                              }
                              placeholder="Type your answer..."
                              className="w-full p-3 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent dark:bg-slate-800 dark:border-gray-600"
                            />
                          ) : isTrueFalse ? (
                            <div className="flex gap-3">
                              {options.map((option) => (
                                <button
                                  key={option}
                                  onClick={() =>
                                    handleAnswerChange(question.id, option)
                                  }
                                  className={cn(
                                    "flex-1 px-4 py-3 rounded-lg font-medium transition-all border-2",
                                    userAnswer === option
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700"
                                  )}
                                >
                                  {option}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {options.map((option, optIndex) => (
                                <button
                                  key={optIndex}
                                  onClick={() =>
                                    handleAnswerChange(question.id, option)
                                  }
                                  className={cn(
                                    "w-full text-left px-4 py-3 rounded-lg text-sm transition-all border-2",
                                    userAnswer === option
                                      ? "bg-primary text-primary-foreground border-primary"
                                      : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700"
                                  )}
                                >
                                  <span className="font-medium mr-2">
                                    {String.fromCharCode(65 + optIndex)}.
                                  </span>
                                  {option}
                                </button>
                              ))}
                            </div>
                          )}
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t px-6 py-4">
                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={handleCloseExam}>
                    {examResult ? "Close" : "Cancel"}
                  </Button>

                  {!examResult && (
                    <Button
                      onClick={() => handleSubmit()}
                      disabled={
                        isSubmitting || Object.keys(answers).length === 0
                      }
                      className="gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <LoaderCircle className="size-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4" />
                          Submit Exam
                        </>
                      )}
                    </Button>
                  )}

                  {examResult && currentExam.isPracticeMode && (
                    <Button
                      onClick={() => handleStartExam(currentExam)}
                      className="gap-2"
                    >
                      <Repeat className="size-4" />
                      Retake Exam
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog
        open={viewingHistory !== null}
        onOpenChange={(open) => !open && setViewingHistory(null)}
      >
        <DialogContent
          className="overflow-y-auto"
          style={{ maxWidth: "90vw", width: "1200px", maxHeight: "90vh" }}
        >
          <DialogTitle className="sr-only">
            Exam History: {viewingHistory?.description || "Exam"}
          </DialogTitle>
          {viewingHistory && (
            <ExamHistoryView
              examId={viewingHistory.id}
              examDescription={viewingHistory.description}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </>
  );
}
