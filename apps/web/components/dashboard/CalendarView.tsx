"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getCalendarEvents, CalendarEvent } from "@/lib/actions/calendarActions";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
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
        return <ClipboardList className="w-3 h-3" />;
      case "exam":
        return <GraduationCap className="w-3 h-3" />;
      case "study_session":
        return <Clock className="w-3 h-3" />;
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
    hasTasks: "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-blue-500",
    hasExams: "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-pink-500",
    hasStudySessions: "after:absolute after:bottom-0.5 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-green-500",
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

  const currentDayEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth("prev")}
              className="h-6 w-6"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigateMonth("next")}
              className="h-6 w-6"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-[280px]">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
              className="w-full flex justify-center p-2"
              classNames={{
                  month: "space-y-4 w-full",
                  caption: "hidden", // We have our own header
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex w-full justify-between mb-2",
                  head_cell: "text-[0.7rem] font-medium text-muted-foreground w-8 text-center",
                  row: "flex w-full mt-2 justify-between",
                  cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 h-8 w-8",
                  day: "h-8 w-8 p-0 font-normal text-sm aria-selected:opacity-100 hover:bg-muted rounded-md transition-colors",
                  day_today: "bg-accent text-accent-foreground",
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              }}
            />
          )}
        </CardContent>
      </Card>

      <Card className="bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <CardHeader className="p-3 border-b">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <CalendarIcon className="w-3 h-3" />
            {selectedDate
              ? format(selectedDate, "MMM dd")
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3">
          {selectedDate && currentDayEvents.length > 0 ? (
            <div className="space-y-2">
              {currentDayEvents.map((event) => (
                <div
                  key={`${event.type}-${event.id}`}
                  className="flex items-start gap-2 text-sm"
                >
                   <div className="mt-1 shrink-0" style={{ color: event.color || "#6366f1" }}>
                    {getEventIcon(event.type)}
                   </div>
                   <div className="min-w-0 flex-1">
                     <p className="font-medium truncate leading-tight small-caps">{event.title}</p>
                     {event.startTime && (
                       <p className="text-[10px] text-muted-foreground">
                         {format(parseISO(event.startTime), "h:mm a")}
                       </p>
                     )}
                   </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">
              No events
            </p>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">Upcoming</h4>
        {events.length > 0 ? (
          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {events.slice(0, 5).map((event) => (
              <div
                key={`${event.type}-${event.id}`}
                className="p-2 rounded-md border bg-card text-xs hover:bg-accent transition-colors flex items-center gap-2"
              >
                <div className="shrink-0" style={{ color: event.color || "#6366f1" }}>
                  {getEventIcon(event.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{event.title}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {format(parseISO(event.date), "MMM dd")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground text-center py-2">
            No upcoming events
          </p>
        )}
      </div>
    </div>
  );
}

