"use client";

import { useState, useEffect } from "react";
import {
  getAllExams,
  deleteExam,
  getExamById,
  evaluateAnswers,
} from "@/lib/actions/examActionts";
import { Exam, Question, ExamStatusEnum } from "@repo/db";
import {
  Item,
  ItemGroup,
  ItemHeader,
  ItemTitle,
  ItemDescription,
  ItemActions,
  ItemContent,
} from "@/components/ui/item";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Trash2,
  LoaderCircle,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";

type ExamWithCount = Exam & {
  subject: { id: number; title: string };
  _count: { questions: number };
};

type ExamWithQuestions = Exam & {
  questions: Question[];
  subject: { id: number; title: string };
};

export default function ExamsList() {
  const [exams, setExams] = useState<ExamWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedExam, setSelectedExam] = useState<ExamWithQuestions | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [answerResults, setAnswerResults] = useState<Record<number, boolean>>(
    {}
  );
  const [isEvaluating, setIsEvaluating] = useState(false);

  useEffect(() => {
    loadExams();
  }, []);

  const loadExams = async () => {
    setLoading(true);
    const result = await getAllExams();
    if (result.success && result.data) {
      setExams(result.data.exams as ExamWithCount[]);
    } else {
      toast.error(result.error || "Failed to load exams");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this exam?")) {
      return;
    }

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

  const handleExamClick = async (exam: ExamWithCount) => {
    if (exam.status !== ExamStatusEnum.READY) {
      toast.info("This exam is still being generated. Please wait.");
      return;
    }

    const result = await getExamById(exam.id);
    if (result.success && result.data) {
      setSelectedExam(result.data.exam as ExamWithQuestions);
      setAnswers({});
      setSubmitted(false);
      setAnswerResults({});
      setIsEvaluating(false);
      setIsDialogOpen(true);
    } else {
      toast.error(result.error || "Failed to load exam questions");
    }
  };

  const handleAnswerChange = (questionId: number, answer: string) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = () => {
    if (!selectedExam) return;

    const totalQuestions = selectedExam.questions.length;
    const answeredQuestions = Object.keys(answers).length;

    if (answeredQuestions < totalQuestions) {
      if (
        !confirm(
          `You have only answered ${answeredQuestions} out of ${totalQuestions} questions. Do you want to submit anyway?`
        )
      ) {
        return;
      }
    }

    setSubmitted(true);
    calculateScore();
  };

  const calculateScore = async () => {
    if (!selectedExam) return;

    setIsEvaluating(true);

    try {
      const answersToEvaluate = selectedExam.questions
        .filter((question) => answers[question.id])
        .map((question) => ({
          questionId: question.id,
          userAnswer: answers[question.id] || "",
        }));

      if (answersToEvaluate.length === 0) {
        toast.error("Please answer at least one question before submitting.");
        setIsEvaluating(false);
        return;
      }

      const result = await evaluateAnswers(answersToEvaluate);

      if (!result.success || !result.data) {
        toast.error(result.error || "Failed to evaluate answers.");
        setIsEvaluating(false);
        return;
      }

      const resultsMap: Record<number, boolean> = {};
      result.data.forEach((evaluation) => {
        resultsMap[evaluation.questionId] = evaluation.isCorrect;
      });
      setAnswerResults(resultsMap);

      let correct = 0;
      result.data.forEach((evaluation) => {
        if (evaluation.isCorrect) {
          correct++;
        }
      });

      const total = selectedExam.questions.length;
      const percentage = (correct / total) * 100;

      toast.success(
        `You scored ${correct}/${total} (${percentage.toFixed(1)}%)`,
        { duration: 5000 }
      );
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "An error occurred while evaluating answers."
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const isAnswerCorrectSimple = (
    userAnswer: string,
    correctAnswer: string
  ): boolean => {
    return (
      userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
    );
  };

  const getStatusBadge = (status: ExamStatusEnum) => {
    switch (status) {
      case ExamStatusEnum.READY:
        return (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="size-3" />
            Ready
          </span>
        );
      case ExamStatusEnum.GENERATING:
        return (
          <span className="flex items-center gap-1 text-xs text-yellow-600">
            <Clock className="size-3" />
            Generating
          </span>
        );
      case ExamStatusEnum.FAILED:
        return (
          <span className="flex items-center gap-1 text-xs text-red-600">
            <XCircle className="size-3" />
            Failed
          </span>
        );
      default:
        return null;
    }
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
      <div className="rounded-md mx-auto border border-black w-full flex-1 p-8">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <FileText />
            </EmptyMedia>
            <EmptyTitle>No exams yet</EmptyTitle>
            <EmptyDescription>
              Create your first exam to get started with practice tests.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <div className="rounded-md mx-auto border border-black w-full flex-1 p-4 overflow-y-auto">
      <ItemGroup className="space-y-2 ">
        {exams.map((exam) => (
          <Item
            key={exam.id}
            variant="outline"
            className={`cursor-pointer transition-colors hover:bg-accent ${
              exam.status === ExamStatusEnum.READY
                ? "hover:border-primary"
                : "opacity-60"
            }`}
            onClick={() => handleExamClick(exam)}
          >
            <ItemHeader>
              <ItemContent>
                <ItemTitle className="flex items-center gap-2">
                  {exam.description}
                  {getStatusBadge(exam.status)}
                </ItemTitle>
                <ItemDescription>
                  Subject: {exam.subject.title} • {exam._count.questions}{" "}
                  questions
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={(e) => handleDelete(exam.id, e)}
                  disabled={deletingId === exam.id}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  {deletingId === exam.id ? (
                    <LoaderCircle className="size-4 animate-spin" />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                </Button>
              </ItemActions>
            </ItemHeader>
          </Item>
        ))}
      </ItemGroup>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-6xl! max-h-[90vh]! overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExam?.description}</DialogTitle>
            <DialogDescription>
              Subject: {selectedExam?.subject.title} •{" "}
              {selectedExam?.questions.length} questions
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {selectedExam?.questions.map((question, index) => {
              const options = (question.options as string[]) || [];
              const userAnswer = answers[question.id];
              const isCorrect =
                submitted && answerResults[question.id] !== undefined
                  ? answerResults[question.id]
                  : userAnswer
                    ? isAnswerCorrectSimple(userAnswer, question.correctAnswer)
                    : false;
              const showResult = submitted && userAnswer;
              const isIdentification = question.type === "IDENTIFICATION";
              const isTrueFalse = question.type === "TRUE_FALSE";

              return (
                <div
                  key={question.id}
                  className={`p-5 rounded-lg border transition-all ${
                    showResult
                      ? isCorrect
                        ? "border-green-500 dark:border-green-400 bg-green-50 dark:bg-green-900/20"
                        : "border-red-500 dark:border-red-400 bg-red-50 dark:bg-red-900/20"
                      : "border-border dark:border-gray-700 bg-white dark:bg-slate-800/50"
                  }`}
                >
                  <div className="flex items-start gap-3 mb-4">
                    <span className="font-bold text-base text-primary shrink-0 min-w-8">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                        {question.text}
                      </p>
                      <span className="text-xs text-muted-foreground mt-2 inline-block px-2 py-0.5 rounded-full bg-muted/50">
                        {question.type.replace("_", " ").toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {isIdentification ? (
                    <div className="ml-9">
                      <input
                        type="text"
                        value={userAnswer || ""}
                        onChange={(e) =>
                          handleAnswerChange(question.id, e.target.value)
                        }
                        disabled={submitted}
                        placeholder="Type your answer here..."
                        className="w-full p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-900 dark:border-gray-600"
                      />
                      {submitted && (
                        <div className="mt-3 text-xs">
                          <p className="text-muted-foreground">
                            Correct answer:{" "}
                            <span className="font-semibold">
                              {question.correctAnswer}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : isTrueFalse ? (
                    <div className="ml-9 flex gap-3">
                      {options.map((option, optIndex) => {
                        const isSelected = userAnswer === option;
                        const isCorrectOption = isAnswerCorrectSimple(
                          option,
                          question.correctAnswer
                        );

                        return (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors font-medium ${
                              submitted
                                ? isCorrectOption
                                  ? "bg-green-100 dark:bg-green-900/30 border-2 border-green-500 dark:border-green-400 text-green-700 dark:text-green-300"
                                  : isSelected && !isCorrect
                                    ? "bg-red-100 dark:bg-red-900/30 border-2 border-red-500 dark:border-red-400 text-red-700 dark:text-red-300"
                                    : "bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                                : isSelected
                                  ? "bg-primary text-primary-foreground border-2 border-primary"
                                  : "bg-gray-100 dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={isSelected}
                              onChange={(e) =>
                                handleAnswerChange(question.id, e.target.value)
                              }
                              disabled={submitted}
                              className="cursor-pointer"
                            />
                            <span className="text-sm">{option}</span>
                            {submitted && isCorrectOption && (
                              <CheckCircle2 className="size-4" />
                            )}
                            {submitted && isSelected && !isCorrect && (
                              <XCircle className="size-4" />
                            )}
                          </label>
                        );
                      })}
                      {submitted && (
                        <div className="mt-3 text-xs w-full">
                          <p className="text-muted-foreground">
                            Correct answer:{" "}
                            <span className="font-semibold">
                              {question.correctAnswer}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2.5 ml-9">
                      {options.map((option, optIndex) => {
                        const isSelected = userAnswer === option;
                        const isCorrectOption = isAnswerCorrectSimple(
                          option,
                          question.correctAnswer
                        );

                        return (
                          <label
                            key={optIndex}
                            className={`flex items-center gap-2 p-2 rounded cursor-pointer transition-colors ${
                              submitted
                                ? isCorrectOption
                                  ? "bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700"
                                  : isSelected && !isCorrect
                                    ? "bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700"
                                    : "bg-gray-50 dark:bg-gray-800"
                                : isSelected
                                  ? "bg-accent border-primary"
                                  : "hover:bg-accent/50 border-transparent"
                            } border`}
                          >
                            <input
                              type="radio"
                              name={`question-${question.id}`}
                              value={option}
                              checked={isSelected}
                              onChange={(e) =>
                                handleAnswerChange(question.id, e.target.value)
                              }
                              disabled={submitted}
                              className="cursor-pointer"
                            />
                            <span className="text-sm flex-1">{option}</span>
                            {submitted && isCorrectOption && (
                              <CheckCircle2 className="size-4 text-green-600 dark:text-green-400" />
                            )}
                            {submitted && isSelected && !isCorrect && (
                              <XCircle className="size-4 text-red-600 dark:text-red-400" />
                            )}
                          </label>
                        );
                      })}
                      {submitted && (
                        <div className="mt-3 text-xs">
                          <p className="text-muted-foreground">
                            Correct answer:{" "}
                            <span className="font-semibold">
                              {question.correctAnswer}
                            </span>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!submitted && (
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Close
              </Button>
              <Button onClick={handleSubmit} disabled={isEvaluating}>
                {isEvaluating ? "Evaluating..." : "Submit Answers"}
              </Button>
            </div>
          )}

          {submitted && (
            <div className="flex justify-end mt-6">
              <Button onClick={() => setIsDialogOpen(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
