"use client";

import { useQuery } from "@tanstack/react-query";
import { getClassSchedule } from "@/lib/actions/scheduleActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  User,
  Clock,
  CalendarDays,
  List,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { EditClassScheduleDialog } from "./EditClassScheduleDialog";

type ScheduleItem = {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string | null;
  instructor: string | null;
  type: string;
  subject: {
    title: string;
  } | null;
};

const DAYS = [
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
  "SUNDAY",
];

export function ClassSchedule({
  initialSchedule,
}: {
  initialSchedule?: any[];
}) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentDay, setCurrentDay] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>("");
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);

  useEffect(() => {
    // Update current day and time on mount
    const updateTime = () => {
      const now = new Date();
      const days = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];
      const dayName = days[now.getDay()];
      setCurrentDay(dayName || "");
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["classSchedule"],
    queryFn: async () => {
      const result = await getClassSchedule();
      if (!result.success) throw new Error(result.error);
      return result.data as unknown as ScheduleItem[];
    },
    initialData: initialSchedule as unknown as ScheduleItem[],
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const isCurrentClass = (item: ScheduleItem) => {
    if (item.dayOfWeek !== currentDay) return false;
    return currentTime >= item.startTime && currentTime <= item.endTime;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const scheduleByDay = DAYS.reduce(
    (acc, day) => {
      acc[day] = (data || []).filter((item) => item.dayOfWeek === day);
      return acc;
    },
    {} as Record<string, ScheduleItem[]>
  );

  // Filter out days with no schedule if you want a compact view, or keep them empty
  const activeDays = DAYS.filter(
    (day) => (scheduleByDay[day]?.length || 0) > 0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Today is{" "}
          <span className="font-semibold text-foreground">{currentDay}</span>
        </div>
        <div className="flex bg-muted rounded-lg p-1 self-end sm:self-auto">
          <Button
            variant={viewMode === "grid" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("grid")}
            className="text-xs gap-2"
          >
            <CalendarDays className="w-4 h-4" />
            Grid
          </Button>
          <Button
            variant={viewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="text-xs gap-2"
          >
            <List className="w-4 h-4" />
            List
          </Button>
        </div>
      </div>

      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {activeDays.length > 0 ? (
            activeDays.map((day) => (
              <Card
                key={day}
                className={cn(
                  "overflow-hidden border-t-4 shadow-sm hover:shadow-md transition-all",
                  day === currentDay
                    ? "border-t-purple-600 ring-2 ring-purple-600/20"
                    : "border-t-pink-500"
                )}
              >
                <CardHeader className="bg-slate-50 dark:bg-slate-900/50 py-3 border-b flex flex-row items-center justify-between">
                  <CardTitle
                    className={cn(
                      "text-sm font-bold tracking-wider mx-auto",
                      day === currentDay
                        ? "text-purple-700 dark:text-purple-400"
                        : "text-slate-600 dark:text-slate-300"
                    )}
                  >
                    {day}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y divide-slate-100 dark:divide-slate-800">
                    {scheduleByDay[day]?.map((item) => {
                      const active = isCurrentClass(item);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "group p-4 flex gap-4 transition-colors relative cursor-pointer",
                            active
                              ? "bg-purple-50 dark:bg-purple-900/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            !active &&
                              item.type === "REVIEW_SESSION" &&
                              "bg-amber-50/50 dark:bg-amber-950/10"
                          )}
                          onClick={() => setEditingItem(item)}
                        >
                          {active && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600" />
                          )}
                          <div className="flex flex-col items-center justify-center min-w-18 text-xs font-medium text-slate-500">
                            <span
                              className={cn(
                                active &&
                                  "text-purple-700 dark:text-purple-400 font-bold"
                              )}
                            >
                              {item.startTime}
                            </span>
                            <div
                              className={cn(
                                "w-0.5 h-3 my-1 rounded-full",
                                active
                                  ? "bg-purple-300 dark:bg-purple-700"
                                  : "bg-slate-200 dark:bg-slate-700"
                              )}
                            />
                            <span
                              className={cn(
                                active &&
                                  "text-purple-700 dark:text-purple-400 font-bold"
                              )}
                            >
                              {item.endTime}
                            </span>
                          </div>

                          <div className="flex-1 space-y-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4
                                className={cn(
                                  "font-semibold text-sm line-clamp-2",
                                  active
                                    ? "text-purple-900 dark:text-purple-100"
                                    : "text-slate-800 dark:text-slate-200"
                                )}
                              >
                                {item.subject?.title ||
                                  (item.type === "REVIEW_SESSION"
                                    ? "Review Session"
                                    : "Free Time")}
                              </h4>
                              {active && (
                                <Badge className="bg-purple-600 hover:bg-purple-700 text-[10px] px-1.5 h-5 shrink-0 animate-pulse">
                                  NOW
                                </Badge>
                              )}
                              {!active && item.type !== "CLASS" && (
                                <Badge
                                  variant="secondary"
                                  className="text-[10px] px-1.5 h-5 shrink-0"
                                >
                                  {item.type.replace("_", " ")}
                                </Badge>
                              )}

                              <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2" />
                            </div>

                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                              {item.room ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  <span>{item.room}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground/50">
                                  <MapPin className="w-3 h-3" />
                                  <span>Set room</span>
                                </div>
                              )}
                              {item.instructor ? (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  <span>{item.instructor}</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground/50">
                                  <User className="w-3 h-3" />
                                  <span>Set instructor</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="overflow-hidden border-dashed">
                <CardContent className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mb-4 opacity-20" />
                  <p>No classes scheduled yet.</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {activeDays.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeDays.map((day) => (
                  <div key={day} className="group/day">
                    {scheduleByDay[day]?.map((item, index) => {
                      const active = isCurrentClass(item);
                      return (
                        <div
                          key={item.id}
                          className={cn(
                            "group p-4 flex flex-col sm:flex-row sm:items-center gap-4 transition-colors relative cursor-pointer",
                            active
                              ? "bg-purple-50 dark:bg-purple-900/20"
                              : "hover:bg-slate-50 dark:hover:bg-slate-800/50",
                            !active &&
                              item.type === "REVIEW_SESSION" &&
                              "bg-amber-50/50 dark:bg-amber-950/10"
                          )}
                          onClick={() => setEditingItem(item)}
                        >
                          {active && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-600 sm:w-1.5" />
                          )}
                          <div className="w-32 shrink-0">
                            {index === 0 && (
                              <span
                                className={cn(
                                  "text-sm font-bold uppercase tracking-wider",
                                  day === currentDay
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-slate-500"
                                )}
                              >
                                {day.slice(0, 3)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 w-32 shrink-0 text-sm font-medium text-slate-600 dark:text-slate-400">
                            <Clock
                              className={cn(
                                "w-3 h-3",
                                active && "text-purple-600"
                              )}
                            />
                            <span
                              className={cn(
                                active &&
                                  "text-purple-700 dark:text-purple-300 font-bold"
                              )}
                            >
                              {item.startTime} - {item.endTime}
                            </span>
                          </div>

                          <div className="flex-1 min-w-0 relative">
                            <div className="flex items-center gap-2 mb-1 pr-6">
                              <h4
                                className={cn(
                                  "font-semibold text-sm truncate",
                                  active
                                    ? "text-purple-900 dark:text-purple-100"
                                    : "text-slate-900 dark:text-slate-100"
                                )}
                              >
                                {item.subject?.title ||
                                  (item.type === "REVIEW_SESSION"
                                    ? "Review Session"
                                    : "Free Time")}
                              </h4>
                              {active && (
                                <Badge className="bg-purple-600 hover:bg-purple-700 text-[10px] h-5 animate-pulse">
                                  HAPPENING NOW
                                </Badge>
                              )}
                              {!active && item.type !== "CLASS" && (
                                <Badge
                                  variant="outline"
                                  className="text-[10px] h-5"
                                >
                                  {item.type.replace("_", " ")}
                                </Badge>
                              )}
                            </div>

                            <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity absolute top-0 right-0" />

                            <div className="flex gap-4 text-xs text-slate-500">
                              {item.room ? (
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {item.room}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground/50">
                                  <MapPin className="w-3 h-3" />
                                  Set room
                                </div>
                              )}
                              {item.instructor ? (
                                <div className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {item.instructor}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-muted-foreground/50">
                                  <User className="w-3 h-3" />
                                  Set instructor
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
                <Clock className="w-12 h-12 mb-4 opacity-20" />
                <p>No classes scheduled yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {editingItem && (
        <EditClassScheduleDialog
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          scheduleId={editingItem.id}
          initialRoom={editingItem.room}
          initialInstructor={editingItem.instructor}
          subjectName={
            editingItem.subject?.title ||
            (editingItem.type === "REVIEW_SESSION"
              ? "Review Session"
              : "Free Time")
          }
        />
      )}
    </div>
  );
}
