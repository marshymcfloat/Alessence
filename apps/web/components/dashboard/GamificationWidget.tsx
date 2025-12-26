"use client";

import { useQuery } from "@tanstack/react-query";
import { getGamificationStats, type GamificationStats } from "@/lib/actions/gamificationActions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Trophy, Star, Zap, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function GamificationWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["gamification-stats"],
    queryFn: async () => {
      const result = await getGamificationStats();
      return result.success ? result.data : null;
    },
    refetchInterval: 60000, // Refetch every minute
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-20 rounded-full" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="flex items-center gap-2">
      {/* Streak Badge */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
              data.streak.current > 0
                ? "bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 text-orange-700 dark:text-orange-300"
                : "bg-muted text-muted-foreground"
            )}>
              <Flame className={cn(
                "w-4 h-4",
                data.streak.current > 0 && "text-orange-500 animate-pulse"
              )} />
              <span>{data.streak.current}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">🔥 {data.streak.current} day streak</p>
            <p className="text-xs text-muted-foreground">
              Longest: {data.streak.longest} days • Total: {data.streak.totalDays} study days
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Level Badge with XP Progress */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="h-auto p-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-purple-500 fill-purple-500" />
                <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                  Lv.{data.xp.level}
                </span>
              </div>
              <div className="w-16 h-1.5 bg-purple-200 dark:bg-purple-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${data.xp.progress}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-violet-500"
                />
              </div>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Achievements & Progress
            </DialogTitle>
            <DialogDescription>
              Track your study journey and unlock achievements
            </DialogDescription>
          </DialogHeader>
          <AchievementsPanel stats={data} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AchievementsPanel({ stats }: { stats: GamificationStats }) {
  const categories = [
    { id: "STREAK", label: "Streaks", icon: "🔥" },
    { id: "EXAM", label: "Exams", icon: "📝" },
    { id: "FLASHCARD", label: "Flashcards", icon: "🃏" },
    { id: "STUDY_TIME", label: "Study Time", icon: "⏱️" },
    { id: "SOCIAL", label: "Social", icon: "👥" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 text-center bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/30 dark:to-red-950/30 border-orange-200/50 dark:border-orange-800/30">
          <Flame className="w-8 h-8 mx-auto text-orange-500 mb-2" />
          <p className="text-2xl font-bold text-orange-700 dark:text-orange-300">
            {stats.streak.current}
          </p>
          <p className="text-xs text-muted-foreground">Day Streak</p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-950/30 dark:to-violet-950/30 border-purple-200/50 dark:border-purple-800/30">
          <Star className="w-8 h-8 mx-auto text-purple-500 fill-purple-500 mb-2" />
          <p className="text-2xl font-bold text-purple-700 dark:text-purple-300">
            {stats.xp.level}
          </p>
          <p className="text-xs text-muted-foreground">Level</p>
        </Card>

        <Card className="p-4 text-center bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 border-yellow-200/50 dark:border-yellow-800/30">
          <Trophy className="w-8 h-8 mx-auto text-yellow-500 mb-2" />
          <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
            {stats.achievements.unlockedCount}
          </p>
          <p className="text-xs text-muted-foreground">Achievements</p>
        </Card>
      </div>

      {/* XP Progress */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="font-medium">Experience Points</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {stats.xp.total} / {stats.xp.nextLevelXP} XP
          </span>
        </div>
        <Progress value={stats.xp.progress} className="h-2" />
        <p className="text-xs text-muted-foreground mt-1">
          {Math.round(stats.xp.nextLevelXP - stats.xp.total)} XP until Level {stats.xp.level + 1}
        </p>
      </Card>

      {/* Achievements by Category */}
      {categories.map((category) => {
        const unlocked = stats.achievements.unlocked.filter(
          (a) => a.category === category.id
        );
        const locked = stats.achievements.locked.filter(
          (a) => a.category === category.id
        );

        if (unlocked.length === 0 && locked.length === 0) return null;

        return (
          <div key={category.id}>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>{category.icon}</span>
              {category.label}
              <Badge variant="secondary" className="ml-auto">
                {unlocked.length}/{unlocked.length + locked.length}
              </Badge>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {unlocked.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} unlocked />
              ))}
              {locked.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} unlocked={false} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AchievementCard({
  achievement,
  unlocked,
}: {
  achievement: GamificationStats["achievements"]["unlocked"][0];
  unlocked: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-3 rounded-lg border transition-all",
        unlocked
          ? "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20 border-yellow-200 dark:border-yellow-800/50"
          : "bg-muted/30 border-muted opacity-60"
      )}
    >
      <div className="flex items-start gap-2">
        <span className="text-2xl">{unlocked ? achievement.icon : "🔒"}</span>
        <div className="flex-1 min-w-0">
          <p className={cn(
            "font-medium text-sm truncate",
            !unlocked && "text-muted-foreground"
          )}>
            {achievement.name}
          </p>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {achievement.description}
          </p>
          {unlocked && achievement.unlockedAt && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-1">
              Unlocked {formatDistanceToNow(new Date(achievement.unlockedAt), { addSuffix: true })}
            </p>
          )}
          {!unlocked && (
            <div className="flex items-center gap-1 mt-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              <span className="text-xs text-muted-foreground">
                +{achievement.xpReward} XP
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Compact version for navbar
export function GamificationBadge() {
  const { data, isLoading } = useQuery({
    queryKey: ["gamification-stats"],
    queryFn: async () => {
      const result = await getGamificationStats();
      return result.success ? result.data : null;
    },
    staleTime: 30000,
  });

  if (isLoading || !data) {
    return <Skeleton className="h-8 w-24 rounded-full" />;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-muted/50 text-sm">
            <Flame className={cn(
              "w-3.5 h-3.5",
              data.streak.current > 0 ? "text-orange-500" : "text-muted-foreground"
            )} />
            <span className="font-medium">{data.streak.current}</span>
            <span className="text-muted-foreground mx-0.5">•</span>
            <Star className="w-3.5 h-3.5 text-purple-500 fill-purple-500" />
            <span className="font-medium">{data.xp.level}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>🔥 {data.streak.current} day streak • ⭐ Level {data.xp.level}</p>
          <p className="text-xs text-muted-foreground">{data.xp.total} XP total</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

