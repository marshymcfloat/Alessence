"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SubjectPerformance } from "@/lib/actions/analyticsActions";
import { Card } from "@/components/ui/card";

interface SubjectPerformanceChartProps {
  data: SubjectPerformance[];
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[160px]">
      <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-2 border-b border-gray-200 dark:border-gray-700 pb-2">
        {label}
      </p>
      <div className="space-y-1.5">
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {entry.name}
              </span>
            </div>
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {entry.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SubjectPerformanceChart({
  data,
}: SubjectPerformanceChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No performance data available
          </p>
        </div>
      </Card>
    );
  }

  const chartData = data.map((subject) => ({
    subject: subject.subjectTitle,
    average: Math.round(subject.averageScore),
    best: Math.round(subject.bestScore),
    worst: Math.round(subject.worstScore),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">
        Subject Performance Comparison
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis
            dataKey="subject"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(0, 0, 0, 0.05)" }} />
          <Legend 
            wrapperStyle={{ paddingTop: "10px" }}
            formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>}
          />
          <Bar dataKey="average" fill="#1f2937" name="Average" radius={[4, 4, 0, 0]} />
          <Bar dataKey="best" fill="#10B981" name="Best" radius={[4, 4, 0, 0]} />
          <Bar dataKey="worst" fill="#EF4444" name="Worst" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

