"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getGamificationStats,
  type GamificationStats,
} from "@/lib/actions/progressActions";
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
import { motion } from "framer-motion";
import { Flame, Trophy, Award, Zap, Briefcase } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

export function ProfessionalProfileWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ["gamification-stats"],
    queryFn: async () => {
      const result = await getGamificationStats();
      return result.success ? result.data : null;
    },
    refetchInterval: 60000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>
    );
  }

  if (!data || !data.streak || !data.profile) return null;

  const streakCurrent = data.streak.current ?? 0;

  return (
    <div className="flex items-center gap-2">
      {/* Discipline Streak */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all",
                streakCurrent > 0
                  ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                  : "bg-muted text-muted-foreground"
              )}
            >
              <Flame
                className={cn(
                  "w-4 h-4",
                  streakCurrent > 0
                    ? "text-slate-600 dark:text-slate-400"
                    : "text-muted-foreground"
                )}
              />
              <span>{streakCurrent}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-semibold">
              Professional Discipline: {streakCurrent} days
            </p>
            <p className="text-xs text-muted-foreground">
              Consistent study builds professional competence.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="h-auto p-0 hover:bg-transparent">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border border-transparent shadow-sm hover:shadow-md transition-all">
              <Briefcase className="w-3.5 h-3.5" />
              <span className="text-sm font-semibold">{data.profile.rank}</span>
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="!max-w-[90vw] !w-[800px] !max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              Professional Competency Profile
            </DialogTitle>
            <DialogDescription>
              Your journey from Reviewee to Practitioner
            </DialogDescription>
          </DialogHeader>
          <ProfilePanel stats={data} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ProfilePanel({ stats }: { stats: GamificationStats }) {
  const categories = [
    { id: "EXAM", label: "Competency Markers", icon: "📝" },
    { id: "STREAK", label: "Discipline", icon: "⚡" },
    { id: "STUDY_TIME", label: "Focus Hours", icon: "🕐" },
    { id: "FLASHCARD", label: "Retention Mastery", icon: "🧠" },
    { id: "SOCIAL", label: "Network", icon: "👥" },
  ];

  const streakCurrent = stats.streak?.current ?? 0;
  const badgesUnlockedCount = stats.badges?.unlockedCount ?? 0;
  const profileRank = stats.profile?.rank ?? "Reviewee";
  const profileNextRank = stats.profile?.nextRank ?? "Candidate";
  const profileProgress = stats.profile?.progress ?? 0;
  const profileTotalPoints = stats.profile?.totalPoints ?? 0;

  return (
    <div className="space-y-6">
      {/* Rank Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm">
              <Briefcase className="w-8 h-8 text-slate-700 dark:text-slate-300" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
                Current Standing
              </p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {profileRank}
              </h3>
            </div>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">
                Progress to {profileNextRank}
              </span>
              <span className="font-medium">
                {Math.round(profileProgress)}%
              </span>
            </div>
            <Progress value={profileProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {profileTotalPoints} Competency Points accumulated
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 flex flex-col justify-center items-center text-center">
            <Flame className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-2xl font-bold">{streakCurrent}</span>
            <span className="text-xs text-muted-foreground">
              Day Discipline
            </span>
          </Card>
          <Card className="p-4 flex flex-col justify-center items-center text-center">
            <Award className="w-6 h-6 text-slate-500 mb-2" />
            <span className="text-2xl font-bold">{badgesUnlockedCount}</span>
            <span className="text-xs text-muted-foreground">
              Markers Earned
            </span>
          </Card>
        </div>
      </div>

      {/* Badges by Category */}
      {categories.map((category) => {
        const unlocked = (stats.badges?.unlocked ?? []).filter(
          (a) => a.category === category.id
        );
        const locked = (stats.badges?.locked ?? []).filter(
          (a) => a.category === category.id
        );

        if (unlocked.length === 0 && locked.length === 0) return null;

        return (
          <div key={category.id}>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <span>{category.icon}</span>
              {category.label}
              <Badge variant="outline" className="ml-auto">
                {unlocked.length}/{unlocked.length + locked.length}
              </Badge>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {unlocked.map((achievement) => (
                <BadgeCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked
                />
              ))}
              {locked.map((achievement) => (
                <BadgeCard
                  key={achievement.id}
                  achievement={achievement}
                  unlocked={false}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function BadgeCard({
  achievement,
  unlocked,
}: {
  achievement: GamificationStats["badges"]["unlocked"][0];
  unlocked: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "p-3 rounded-lg border transition-all flex items-start gap-3",
        unlocked
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm"
          : "bg-slate-50 dark:bg-slate-900/50 border-transparent opacity-60"
      )}
    >
      <div
        className={cn(
          "flex items-center justify-center w-10 h-10 rounded-md text-xl shrink-0",
          unlocked
            ? "bg-slate-100 dark:bg-slate-800"
            : "bg-slate-100 dark:bg-slate-800 grayscale"
        )}
      >
        {achievement.icon}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium text-sm truncate",
            !unlocked && "text-muted-foreground"
          )}
        >
          {achievement.name}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
          {achievement.description}
        </p>
        {unlocked && achievement.unlockedAt && (
          <p className="text-[10px] text-slate-400 mt-1">
            Earned{" "}
            {formatDistanceToNow(new Date(achievement.unlockedAt), {
              addSuffix: true,
            })}
          </p>
        )}
      </div>
    </motion.div>
  );
}
