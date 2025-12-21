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
          <CartesianGrid strokeDasharray="3 3" />
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
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
            formatter={(value: number) => [`${value}%`, ""]}
          />
          <Legend />
          <Bar dataKey="average" fill="hsl(var(--primary))" name="Average" />
          <Bar dataKey="best" fill="#10B981" name="Best" />
          <Bar dataKey="worst" fill="#EF4444" name="Worst" />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

