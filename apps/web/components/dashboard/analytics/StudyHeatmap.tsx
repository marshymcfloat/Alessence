"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, CalendarDays } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapData {
  date: string;
  count: number;
}

interface StudyHeatmapProps {
  data: HeatmapData[];
  streakCurrent?: number;
  streakLongest?: number;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function getIntensityLevel(count: number, maxCount: number): number {
  if (count === 0) return 0;
  if (maxCount <= 0) return 1;
  const ratio = count / maxCount;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.5) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}

function getIntensityClass(level: number): string {
  switch (level) {
    case 0:
      return "bg-slate-100 dark:bg-slate-800/50";
    case 1:
      return "bg-emerald-200 dark:bg-emerald-900/60";
    case 2:
      return "bg-emerald-400 dark:bg-emerald-700";
    case 3:
      return "bg-emerald-500 dark:bg-emerald-500";
    case 4:
      return "bg-emerald-600 dark:bg-emerald-400";
    default:
      return "bg-slate-100 dark:bg-slate-800/50";
  }
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function StudyHeatmap({
  data,
  streakCurrent = 0,
  streakLongest = 0,
}: StudyHeatmapProps) {
  const { weeks, monthLabels, maxCount, totalActivities } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    oneYearAgo.setDate(oneYearAgo.getDate() + 1);

    // Create a map for quick lookup
    const dataMap = new Map<string, number>();
    let max = 0;
    let total = 0;

    data.forEach((item) => {
      dataMap.set(item.date, item.count);
      if (item.count > max) max = item.count;
      total += item.count;
    });

    // Generate weeks - start from the Sunday of the week containing oneYearAgo
    const startDate = new Date(oneYearAgo);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Go back to Sunday

    const weeks: { date: Date; count: number; dateStr: string; isInRange: boolean }[][] = [];
    const monthPositions: { month: number; position: number }[] = [];

    let currentDate = new Date(startDate);
    let lastMonth = -1;

    // Generate 53 weeks (covers full year)
    for (let weekIdx = 0; weekIdx < 53; weekIdx++) {
      const week: { date: Date; count: number; dateStr: string; isInRange: boolean }[] = [];

      for (let dayIdx = 0; dayIdx < 7; dayIdx++) {
        const year = currentDate.getFullYear();
        const month = String(currentDate.getMonth() + 1).padStart(2, "0");
        const day = String(currentDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        
        const isInRange = currentDate >= oneYearAgo && currentDate <= today;
        const count = isInRange ? (dataMap.get(dateStr) ?? 0) : -1;

        week.push({
          date: new Date(currentDate),
          count,
          dateStr,
          isInRange,
        });

        // Track month labels (only at start of each month)
        if (dayIdx === 0) {
          const currentMonth = currentDate.getMonth();
          if (currentMonth !== lastMonth) {
            monthPositions.push({ month: currentMonth, position: weekIdx });
            lastMonth = currentMonth;
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      weeks.push(week);
    }

    return {
      weeks,
      monthLabels: monthPositions,
      maxCount: max,
      totalActivities: total,
    };
  }, [data]);

  const cellSize = 11;
  const cellGap = 3;

  return (
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800 shadow-lg">
      <CardHeader className="pb-1">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <CalendarDays className="w-4 h-4" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold">
                Study Activity
              </CardTitle>
              <p className="text-[10px] text-muted-foreground">
                {totalActivities} {totalActivities === 1 ? "activity" : "activities"} in the last year
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              <span className="font-semibold text-orange-600 dark:text-orange-400">
                {streakCurrent}
              </span>
              <span className="text-muted-foreground">day streak</span>
            </div>
            <div className="text-muted-foreground">
              Best: <span className="font-medium">{streakLongest}</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="overflow-x-auto pb-1">
          <div className="inline-block">
            {/* Month labels row */}
            <div className="flex text-[10px] text-muted-foreground mb-1" style={{ marginLeft: 30 }}>
              {monthLabels.map((m, i) => {
                const nextPosition = monthLabels[i + 1]?.position ?? weeks.length;
                const width = (nextPosition - m.position) * (cellSize + cellGap);
                return (
                  <div
                    key={`${m.month}-${m.position}`}
                    style={{ width }}
                    className="shrink-0"
                  >
                    {MONTHS[m.month]}
                  </div>
                );
              })}
            </div>

            {/* Grid container */}
            <div className="flex">
              {/* Day labels */}
              <div 
                className="flex flex-col text-[10px] text-muted-foreground pr-2 shrink-0"
                style={{ gap: cellGap }}
              >
                <div style={{ height: cellSize }} className="flex items-center justify-end w-5"></div>
                <div style={{ height: cellSize }} className="flex items-center justify-end w-5">Mon</div>
                <div style={{ height: cellSize }} className="flex items-center justify-end w-5"></div>
                <div style={{ height: cellSize }} className="flex items-center justify-end w-5">Wed</div>
                <div style={{ height: cellSize }} className="flex items-center justify-end w-5"></div>
                <div style={{ height: cellSize }} className="flex items-center justify-end w-5">Fri</div>
                <div style={{ height: cellSize }} className="flex items-center justify-end w-5"></div>
              </div>

              {/* Weeks grid */}
              <TooltipProvider delayDuration={100}>
                <div className="flex" style={{ gap: cellGap }}>
                  {weeks.map((week, weekIdx) => (
                    <div 
                      key={weekIdx} 
                      className="flex flex-col"
                      style={{ gap: cellGap }}
                    >
                      {week.map((day, dayIdx) => {
                        if (!day.isInRange) {
                          return (
                            <div
                              key={dayIdx}
                              style={{ width: cellSize, height: cellSize }}
                              className="rounded-[1px]"
                            />
                          );
                        }

                        const level = getIntensityLevel(day.count, maxCount);
                        return (
                          <Tooltip key={dayIdx}>
                            <TooltipTrigger asChild>
                              <div
                                style={{ width: cellSize, height: cellSize }}
                                className={`rounded-[2px] cursor-pointer transition-all hover:ring-2 hover:ring-offset-1 hover:ring-emerald-500/50 dark:hover:ring-offset-slate-900 ${getIntensityClass(level)}`}
                              />
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="text-xs font-medium"
                            >
                              <p>
                                {day.count === 0
                                  ? "No activity"
                                  : `${day.count} ${day.count === 1 ? "activity" : "activities"}`}
                              </p>
                              <p className="text-muted-foreground">
                                {formatDate(day.dateStr)}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </TooltipProvider>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-muted-foreground">
              <span>Less</span>
              <div className="flex" style={{ gap: 2 }}>
                {[0, 1, 2, 3, 4].map((level) => (
                  <div
                    key={level}
                    style={{ width: cellSize, height: cellSize }}
                    className={`rounded-[2px] ${getIntensityClass(level)}`}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
