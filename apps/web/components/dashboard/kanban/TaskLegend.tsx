"use client";

import { useMemo } from "react";
import { Task } from "@repo/db";
import { getSubjectLeftBorder, getSubjectBackground } from "@/lib/utils/taskColors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TaskLegendProps {
  tasks: Task[];
}

export function TaskLegend({ tasks }: TaskLegendProps) {
  // Extract unique subjects from tasks
  const subjects = useMemo(() => {
    const subjectMap = new Map<
      number,
      { id: number; title: string; color: string; bgColor: string }
    >();

    tasks.forEach((task) => {
      const subject = (task as any).subject;
      if (subject && subject.id) {
        if (!subjectMap.has(subject.id)) {
          subjectMap.set(subject.id, {
            id: subject.id,
            title: subject.title,
            color: getSubjectLeftBorder(subject.id),
            bgColor: getSubjectBackground(subject.id),
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
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">Color Legend</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Subject Colors */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Subjects
          </h4>
          <div className="flex flex-wrap gap-2">
            {subjects.map((subject) => (
              <div
                key={subject.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md border-r border-t border-b border-gray-200 ${subject.bgColor} ${subject.color}`}
              >
                <div className={`w-3 h-3 rounded ${subject.bgColor} ${subject.color}`} />
                <span className="text-xs font-medium text-gray-700">
                  {subject.title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Deadline Urgency Colors */}
        <div>
          <h4 className="text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">
            Deadline Urgency
          </h4>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-red-500 bg-red-50">
              <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-100" />
              <span className="text-xs font-medium text-gray-700">Overdue</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-orange-500 bg-orange-50">
              <div className="w-3 h-3 rounded border-2 border-orange-500 bg-orange-100" />
              <span className="text-xs font-medium text-gray-700">
                Urgent (≤1 day)
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border-2 border-yellow-500 bg-yellow-50">
              <div className="w-3 h-3 rounded border-2 border-yellow-500 bg-yellow-100" />
              <span className="text-xs font-medium text-gray-700">
                Soon (≤3 days)
              </span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 bg-gray-50">
              <div className="w-3 h-3 rounded border border-gray-300 bg-gray-100" />
              <span className="text-xs font-medium text-gray-700">Normal</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

