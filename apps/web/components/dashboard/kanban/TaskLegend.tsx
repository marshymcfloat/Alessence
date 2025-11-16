"use client";

import { useMemo } from "react";
import { Task } from "@repo/db";
import { TaskWithSubject } from "@repo/types";
import { getSubjectLeftBorder } from "@/lib/utils/taskColors";

interface TaskLegendProps {
  tasks: (Task | TaskWithSubject)[];
}

function getSubjectIndicatorColor(borderClass: string): string {
  const match = borderClass.match(/border-l-(\w+)-(\d+)/);
  if (match) {
    const [, color, shade] = match;
    return `bg-${color}-${shade}`;
  }
  return "bg-gray-400";
}

export function TaskLegend({ tasks }: TaskLegendProps) {
  const subjects = useMemo(() => {
    const subjectMap = new Map<
      number,
      { id: number; title: string; indicatorColor: string }
    >();

    tasks.forEach((task) => {
      const taskWithSubject = task as TaskWithSubject;
      const subject = taskWithSubject.subject;
      if (subject && subject.id) {
        if (!subjectMap.has(subject.id)) {
          const borderClass = getSubjectLeftBorder(subject.id);
          subjectMap.set(subject.id, {
            id: subject.id,
            title: subject.title,
            indicatorColor: getSubjectIndicatorColor(borderClass),
          });
        }
      }
    });

    return Array.from(subjectMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [tasks]);

  if (subjects.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
      {subjects.length > 0 && (
        <>
          <span className="text-muted-foreground font-medium">Subjects:</span>
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full ${subject.indicatorColor}`}
              />
              <span className="text-muted-foreground">{subject.title}</span>
            </div>
          ))}
        </>
      )}

      {subjects.length > 0 && (
        <span className="text-muted-foreground/30">•</span>
      )}

      <span className="text-muted-foreground font-medium">Deadline:</span>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-red-500 bg-red-100" />
        <span className="text-muted-foreground">Overdue</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 bg-orange-100" />
        <span className="text-muted-foreground">Urgent</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-yellow-500 bg-yellow-100" />
        <span className="text-muted-foreground">Soon</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border border-gray-300 bg-gray-100" />
        <span className="text-muted-foreground">Normal</span>
      </div>
    </div>
  );
}
