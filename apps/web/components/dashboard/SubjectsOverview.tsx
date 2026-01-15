"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  Circle,
  ChevronRight,
  BarChart3,
  ListTodo,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getEnrolledSubject,
  deleteSubjectAction,
} from "@/lib/actions/subjectActions";
import { SubjectWithTaskProgress } from "@repo/types";
import { SemesterEnum } from "@repo/db";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AddSubjectForm from "./AddSubjectForm";
import { useConfirmDialog } from "@/components/ui/confirm-dialog";

// Color palette for subjects
const subjectColors = [
  { bg: "from-pink-500 to-rose-500", light: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-600 dark:text-pink-400", border: "border-pink-300 dark:border-pink-700" },
  { bg: "from-purple-500 to-violet-500", light: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-600 dark:text-purple-400", border: "border-purple-300 dark:border-purple-700" },
  { bg: "from-blue-500 to-cyan-500", light: "bg-blue-100 dark:bg-blue-900/30", text: "text-blue-600 dark:text-blue-400", border: "border-blue-300 dark:border-blue-700" },
  { bg: "from-emerald-500 to-teal-500", light: "bg-emerald-100 dark:bg-emerald-900/30", text: "text-emerald-600 dark:text-emerald-400", border: "border-emerald-300 dark:border-emerald-700" },
  { bg: "from-orange-500 to-amber-500", light: "bg-orange-100 dark:bg-orange-900/30", text: "text-orange-600 dark:text-orange-400", border: "border-orange-300 dark:border-orange-700" },
  { bg: "from-indigo-500 to-blue-500", light: "bg-indigo-100 dark:bg-indigo-900/30", text: "text-indigo-600 dark:text-indigo-400", border: "border-indigo-300 dark:border-indigo-700" },
];

function getSubjectColor(index: number) {
  return subjectColors[index % subjectColors.length]!;
}

interface SubjectsOverviewProps {
  initialSubjects?: SubjectWithTaskProgress[];
  userId: string;
}

export function SubjectsOverview({ initialSubjects, userId }: SubjectsOverviewProps) {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [expandedSubject, setExpandedSubject] = useState<number | null>(null);
  const { confirm, ConfirmDialogComponent } = useConfirmDialog();

  const { data, isLoading } = useQuery({
    queryKey: ["enrolledSubjects"],
    queryFn: getEnrolledSubject,
    initialData: initialSubjects
      ? {
          success: true,
          data: {
            subjects: initialSubjects,
            userId,
          },
        }
      : undefined,
    staleTime: 5 * 60 * 1000,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSubjectAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Subject deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["enrolledSubjects"] });
      } else {
        toast.error(result.error || "Failed to delete subject");
      }
    },
  });

  const subjects = data?.data?.subjects || [];

  // Group subjects by semester
  const firstSemSubjects = subjects.filter(s => s.sem === SemesterEnum.FIRST);
  const secondSemSubjects = subjects.filter(s => s.sem === SemesterEnum.SECOND);

  // Calculate totals
  const totals = subjects.reduce(
    (acc, subject) => ({
      total: acc.total + subject.taskCounts.total,
      done: acc.done + subject.taskCounts.done,
      onProgress: acc.onProgress + subject.taskCounts.onProgress,
      planned: acc.planned + subject.taskCounts.planned,
    }),
    { total: 0, done: 0, onProgress: 0, planned: 0 }
  );

  const overallProgress =
    totals.total > 0 ? Math.round((totals.done / totals.total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Summary */}
      <Card className="p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Overall Progress</h3>
              <p className="text-sm text-muted-foreground">
                {subjects.length} subject{subjects.length !== 1 ? "s" : ""} •{" "}
                {totals.total} total task{totals.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Add Subject
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Subject</DialogTitle>
              </DialogHeader>
              <AddSubjectForm
                onClose={() => {
                  setIsAddDialogOpen(false);
                  queryClient.invalidateQueries({
                    queryKey: ["enrolledSubjects"],
                  });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold">{totals.total}</div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <ListTodo className="w-3 h-3" /> Total Tasks
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-50 dark:bg-green-950">
            <div className="text-2xl font-bold text-green-600">
              {totals.done}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Completed
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-blue-50 dark:bg-blue-950">
            <div className="text-2xl font-bold text-blue-600">
              {totals.onProgress}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Clock className="w-3 h-3" /> In Progress
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-950">
            <div className="text-2xl font-bold text-gray-600">
              {totals.planned}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center gap-1">
              <Circle className="w-3 h-3" /> Planned
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Completion Rate</span>
            <span className="font-semibold">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
        </div>
      </Card>

      {/* Subjects Grid */}
      {subjects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-blue-900/30 flex items-center justify-center">
              <BookOpen className="w-10 h-10 text-purple-500" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No subjects yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first subject to start organizing your tasks and studies
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Your First Subject
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* First Semester */}
          {firstSemSubjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="px-3 py-1 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300">
                  First Semester
                </Badge>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {firstSemSubjects.map((subject, index) => (
                    <SubjectCard 
                      key={subject.id} 
                      subject={subject} 
                      index={index} 
                      expandedSubject={expandedSubject} 
                      setExpandedSubject={setExpandedSubject} 
                      confirm={confirm} 
                      deleteMutation={deleteMutation} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Second Semester */}
          {secondSemSubjects.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="px-3 py-1 bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 text-pink-700 dark:text-pink-300">
                  Second Semester
                </Badge>
                <div className="h-px bg-border flex-1" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <AnimatePresence>
                  {secondSemSubjects.map((subject, index) => (
                    <SubjectCard 
                      key={subject.id} 
                      subject={subject} 
                      index={index} 
                      expandedSubject={expandedSubject} 
                      setExpandedSubject={setExpandedSubject} 
                      confirm={confirm} 
                      deleteMutation={deleteMutation} 
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Confirm Dialog */}
      {ConfirmDialogComponent}
    </div>
  );
}

function SubjectCard({ 
  subject, 
  index, 
  expandedSubject, 
  setExpandedSubject, 
  confirm, 
  deleteMutation 
}: { 
  subject: SubjectWithTaskProgress, 
  index: number, 
  expandedSubject: number | null, 
  setExpandedSubject: (id: number | null) => void, 
  confirm: any, 
  deleteMutation: any 
}) {
  const color = getSubjectColor(index);
  const { taskCounts } = subject;
  const progress =
    taskCounts.total > 0
      ? Math.round((taskCounts.done / taskCounts.total) * 100)
      : 0;
  const isExpanded = expandedSubject === subject.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        className={`p-4 hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${color.border}`}
        onClick={() =>
          setExpandedSubject(isExpanded ? null : subject.id)
        }
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg bg-gradient-to-br ${color.bg} shadow-md`}
            >
              <BookOpen className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold line-clamp-1">
                {subject.title}
              </h4>
              <p className="text-xs text-muted-foreground">
                {taskCounts.total} task
                {taskCounts.total !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={async (e) => {
                e.stopPropagation();
                const confirmed = await confirm({
                  title: "Delete Subject",
                  description: `Are you sure you want to delete "${subject.title}"? All associated tasks will also be deleted.`,
                  confirmText: "Delete",
                  cancelText: "Cancel",
                  variant: "destructive",
                });
                if (confirmed) {
                  deleteMutation.mutate(subject.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" />
            </Button>
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Task Breakdown */}
        <div className="flex items-center gap-3 mt-3 text-xs">
          <div className={`flex items-center gap-1 ${color.text}`}>
            <CheckCircle2 className="w-3 h-3" />
            <span>{taskCounts.done} done</span>
          </div>
          <div className="flex items-center gap-1 text-blue-600">
            <Clock className="w-3 h-3" />
            <span>{taskCounts.onProgress} active</span>
          </div>
          <div className="flex items-center gap-1 text-gray-500">
            <Circle className="w-3 h-3" />
            <span>{taskCounts.planned} planned</span>
          </div>
        </div>

        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="mt-4 pt-4 border-t"
            >
              <div className="space-y-3">
                {/* Status breakdown */}
                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`p-2 rounded-lg ${color.light} text-center`}
                  >
                    <div className="text-lg font-bold">
                      {taskCounts.done}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Done
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950 text-center">
                    <div className="text-lg font-bold text-blue-600">
                      {taskCounts.onProgress}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      In Progress
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-center">
                    <div className="text-lg font-bold text-gray-600">
                      {taskCounts.planned}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Planned
                    </div>
                  </div>
                </div>

                {/* Completion message */}
                {progress === 100 && taskCounts.total > 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 text-sm">
                    <TrendingUp className="w-4 h-4" />
                    <span>All tasks completed! 🎉</span>
                  </div>
                )}
                {taskCounts.total === 0 && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-50 dark:bg-yellow-950 text-yellow-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>No tasks yet. Add some tasks!</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
