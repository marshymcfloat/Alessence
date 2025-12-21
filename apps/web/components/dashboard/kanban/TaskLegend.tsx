"use client";

import { useMemo } from "react";
import type { Task } from "@repo/db";
import { TaskWithSubject } from "@repo/types";

interface TaskLegendProps {
  tasks: (Task | TaskWithSubject)[];
}

function getSubjectIndicatorColor(subjectId: number | null | undefined): {
  bg: string;
  border: string;
} {
  if (!subjectId) {
    return {
      bg: "bg-gray-400 dark:bg-gray-500",
      border: "border-gray-400 dark:border-gray-500",
    };
  }

  const colors = [
    {
      bg: "bg-blue-400 dark:bg-blue-500",
      border: "border-blue-400 dark:border-blue-500",
    },
    {
      bg: "bg-purple-400 dark:bg-purple-500",
      border: "border-purple-400 dark:border-purple-500",
    },
    {
      bg: "bg-pink-400 dark:bg-pink-500",
      border: "border-pink-400 dark:border-pink-500",
    },
    {
      bg: "bg-green-400 dark:bg-green-500",
      border: "border-green-400 dark:border-green-500",
    },
    {
      bg: "bg-yellow-400 dark:bg-yellow-500",
      border: "border-yellow-400 dark:border-yellow-500",
    },
    {
      bg: "bg-indigo-400 dark:bg-indigo-500",
      border: "border-indigo-400 dark:border-indigo-500",
    },
    {
      bg: "bg-red-400 dark:bg-red-500",
      border: "border-red-400 dark:border-red-500",
    },
    {
      bg: "bg-teal-400 dark:bg-teal-500",
      border: "border-teal-400 dark:border-teal-500",
    },
    {
      bg: "bg-orange-400 dark:bg-orange-500",
      border: "border-orange-400 dark:border-orange-500",
    },
    {
      bg: "bg-cyan-400 dark:bg-cyan-500",
      border: "border-cyan-400 dark:border-cyan-500",
    },
    {
      bg: "bg-rose-400 dark:bg-rose-500",
      border: "border-rose-400 dark:border-rose-500",
    },
    {
      bg: "bg-emerald-400 dark:bg-emerald-500",
      border: "border-emerald-400 dark:border-emerald-500",
    },
    {
      bg: "bg-violet-400 dark:bg-violet-500",
      border: "border-violet-400 dark:border-violet-500",
    },
    {
      bg: "bg-amber-400 dark:bg-amber-500",
      border: "border-amber-400 dark:border-amber-500",
    },
    {
      bg: "bg-lime-400 dark:bg-lime-500",
      border: "border-lime-400 dark:border-lime-500",
    },
  ];

  const colorIndex = subjectId % colors.length;
  return colors[colorIndex]!;
}

export function TaskLegend({ tasks }: TaskLegendProps) {
  const subjects = useMemo(() => {
    const subjectMap = new Map<
      number,
      {
        id: number;
        title: string;
        indicatorColor: { bg: string; border: string };
      }
    >();

    tasks.forEach((task) => {
      const taskWithSubject = task as TaskWithSubject;
      const subject = taskWithSubject.subject;
      if (subject && subject.id) {
        if (!subjectMap.has(subject.id)) {
          subjectMap.set(subject.id, {
            id: subject.id,
            title: subject.title,
            indicatorColor: getSubjectIndicatorColor(subject.id),
          });
        }
      }
    });

    return Array.from(subjectMap.values()).sort((a, b) =>
      a.title.localeCompare(b.title)
    );
  }, [tasks]);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-3 text-xs">
      {subjects.length > 0 && (
        <>
          <span className="text-gray-700 dark:text-gray-300 font-medium">
            Subjects:
          </span>
          {subjects.map((subject) => (
            <div key={subject.id} className="flex items-center gap-1.5">
              <div
                className={`w-2.5 h-2.5 rounded-full border-2 ${subject.indicatorColor.border} ${subject.indicatorColor.bg}`}
              />
              <span className="text-gray-600 dark:text-gray-400">
                {subject.title}
              </span>
            </div>
          ))}
        </>
      )}

      {subjects.length > 0 && (
        <span className="text-gray-400 dark:text-gray-600">•</span>
      )}

      <span className="text-gray-700 dark:text-gray-300 font-medium">
        Deadline:
      </span>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-red-500 dark:border-red-400 bg-red-100 dark:bg-red-900/30" />
        <span className="text-gray-600 dark:text-gray-400">Overdue</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 dark:border-orange-400 bg-orange-100 dark:bg-orange-900/30" />
        <span className="text-gray-600 dark:text-gray-400">Urgent</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border-2 border-yellow-500 dark:border-yellow-400 bg-yellow-100 dark:bg-yellow-900/30" />
        <span className="text-gray-600 dark:text-gray-400">Soon</span>
      </div>
      <div className="flex items-center gap-1.5">
        <div className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700" />
        <span className="text-gray-600 dark:text-gray-400">Normal</span>
      </div>
    </div>
  );
}
