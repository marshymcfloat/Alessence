"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCalendarEvents, CalendarEvent } from "@/lib/actions/calendarActions";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  Clock,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CalendarView() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedEvents, setSelectedEvents] = useState<CalendarEvent[]>([]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  const { data, isLoading } = useQuery({
    queryKey: [
      "calendar-events",
      monthStart.toISOString(),
      monthEnd.toISOString(),
    ],
    queryFn: () =>
      getCalendarEvents(monthStart.toISOString(), monthEnd.toISOString()),
  });

  const events = data?.success ? data.data?.events || [] : [];

  const getEventsForDate = (date: Date): CalendarEvent[] => {
    return events.filter((event) => {
      const eventDate = parseISO(event.date);
      return isSameDay(eventDate, date);
    });
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      const dayEvents = getEventsForDate(date);
      setSelectedEvents(dayEvents);
    }
  };

  const getEventIcon = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "task":
        return <ClipboardList className="w-4 h-4" />;
      case "exam":
        return <GraduationCap className="w-4 h-4" />;
      case "study_session":
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventTypeLabel = (type: CalendarEvent["type"]) => {
    switch (type) {
      case "task":
        return "Task";
      case "exam":
        return "Exam";
      case "study_session":
        return "Study Session";
    }
  };

  // Create modifiers for calendar days with events
  const modifiers = {
    hasEvents: (date: Date) => {
      return getEventsForDate(date).length > 0;
    },
    hasTasks: (date: Date) => {
      return getEventsForDate(date).some((e) => e.type === "task");
    },
    hasExams: (date: Date) => {
      return getEventsForDate(date).some((e) => e.type === "exam");
    },
    hasStudySessions: (date: Date) => {
      return getEventsForDate(date).some((e) => e.type === "study_session");
    },
  };

  const modifiersClassNames = {
    hasEvents: "relative",
    hasTasks: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-blue-500",
    hasExams: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-pink-500",
    hasStudySessions: "after:absolute after:bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-green-500",
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
            Calendar
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            View your tasks, exams, and study sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth("prev")}
            className="h-8 w-8"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateMonth("next")}
            className="h-8 w-8"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setCurrentMonth(new Date());
              setSelectedDate(undefined);
            }}
            className="h-8"
          >
            Today
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card className="p-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                month={currentMonth}
                onMonthChange={setCurrentMonth}
                modifiers={modifiers}
                modifiersClassNames={modifiersClassNames}
                className="rounded-md border w-full"
                classNames={{
                   month: "space-y-4 w-full",
                   table: "w-full border-collapse space-y-1",
                   head_row: "flex w-full justify-between",
                   row: "flex w-full mt-2 justify-between",
                   cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-9 w-9",
                   day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
                }}
              />
            )}
          </Card>

          {/* Legend */}
          <Card className="p-3 mt-4">
            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                <span className="text-muted-foreground">Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-pink-500"></div>
                <span className="text-muted-foreground">Exams</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                <span className="text-muted-foreground">Study Sessions</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Events List */}
        <div className="space-y-4">
          <Card className="p-4">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-sm">
              <CalendarIcon className="w-4 h-4" />
              {selectedDate
                ? `Events on ${format(selectedDate, "MMM dd, yyyy")}`
                : "Select a date"}
            </h3>
            {selectedDate ? (
              selectedEvents.length > 0 ? (
                <div className="space-y-2">
                  {selectedEvents.map((event) => (
                    <motion.div
                      key={`${event.type}-${event.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "p-2.5 rounded-lg border cursor-pointer hover:bg-muted transition-colors",
                        `border-l-4`
                      )}
                      style={{
                        borderLeftColor: event.color || "#6366f1",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getEventIcon(event.type)}
                            <Badge variant="secondary" className="text-[10px] h-5">
                              {getEventTypeLabel(event.type)}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm truncate">
                            {event.title}
                          </p>
                          {event.metadata?.subject && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {event.metadata.subject.title}
                            </p>
                          )}
                          {event.startTime && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {format(parseISO(event.startTime), "h:mm a")}
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">
                  No events on this date
                </p>
              )
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                Click on a date to view events
              </p>
            )}
          </Card>

          {/* Upcoming Events */}
          <Card className="p-4">
            <h3 className="font-semibold mb-4 text-sm">Upcoming This Month</h3>
            {events.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {events.slice(0, 10).map((event) => (
                  <div
                    key={`${event.type}-${event.id}`}
                    className="p-2 rounded border text-sm hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getEventIcon(event.type)}
                      <span className="font-medium truncate text-xs">
                        {event.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {format(parseISO(event.date), "MMM dd")}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">
                No upcoming events
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

