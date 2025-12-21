"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getGoalsProgress, deleteGoalAction } from "@/lib/actions/goalActions";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Calendar, Trash2 } from "lucide-react";
import { GoalPeriodEnum, type StudyGoal } from "@repo/db/client-types";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

type StudyGoalWithSubject = StudyGoal & {
  subject: {
    id: number;
    title: string;
  } | null;
};

function formatMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

export function GoalProgressCard() {
  const queryClient = useQueryClient();
  
  const { data, isLoading, error } = useQuery({
    queryKey: ["goals-progress"],
    queryFn: getGoalsProgress,
    refetchInterval: 10000, // Refetch every 10 seconds to update progress more frequently
    staleTime: 0, // Always consider data stale to ensure fresh updates
  });

  const { mutate: deleteGoal, isPending: isDeleting } = useMutation({
    mutationFn: deleteGoalAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Goal deleted successfully");
        queryClient.invalidateQueries({ queryKey: ["goals-progress"] });
      } else {
        toast.error(result.error || "Failed to delete goal");
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete goal");
    },
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
          Failed to load goals progress
        </p>
      </Card>
    );
  }

  const progress = data.data.progress;

  if (progress.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Target className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            No active goals yet
          </p>
          <p className="text-xs text-muted-foreground">
            Create a study goal to track your progress
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {progress.map((item, index) => {
        const isComplete = item.progressPercentage >= 100;
        const isNearComplete = item.progressPercentage >= 80;

        return (
          <motion.div
            key={item.goal.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="p-6 hover:bg-muted/50 transition-colors">
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">
                        {item.goal.periodType === GoalPeriodEnum.DAILY
                          ? "Daily Goal"
                          : "Weekly Goal"}
                      </h3>
                      <Badge
                        variant={
                          isComplete
                            ? "default"
                            : isNearComplete
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {item.goal.periodType === GoalPeriodEnum.DAILY
                          ? "Daily"
                          : "Weekly"}
                      </Badge>
                      {(item.goal as StudyGoalWithSubject).subject && (
                        <Badge variant="outline">
                          {(item.goal as StudyGoalWithSubject).subject!.title}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {item.goal.periodType === GoalPeriodEnum.DAILY
                            ? "Today"
                            : "This Week"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {item.progressPercentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatMinutes(item.currentMinutes)} /{" "}
                        {formatMinutes(item.targetMinutes)}
                      </div>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Goal</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this goal? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteGoal(item.goal.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                  <Progress
                    value={item.progressPercentage}
                    className="h-3"
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {item.currentMinutes >= item.targetMinutes
                        ? "Goal achieved! 🎉"
                        : `${formatMinutes(
                            item.targetMinutes - item.currentMinutes
                          )} remaining`}
                    </span>
                    {item.currentMinutes < item.targetMinutes && (
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {(
                          ((item.targetMinutes - item.currentMinutes) /
                            item.targetMinutes) *
                          100
                        ).toFixed(0)}
                        % to go
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

