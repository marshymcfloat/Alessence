"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TaskCompletionData } from "@/lib/actions/analyticsActions";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface TaskCompletionChartProps {
  data: TaskCompletionData[];
}

export function TaskCompletionChart({ data }: TaskCompletionChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No task completion data available
          </p>
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    rate: Math.round(item.completionRate * 100) / 100,
    completed: item.completed,
    total: item.total,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Task Completion Rates</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 12 }}
            label={{
              value: "Completion Rate (%)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
            formatter={(value: number, name: string) => {
              if (name === "rate") {
                return [`${value}%`, "Completion Rate"];
              }
              return [value, name === "completed" ? "Completed" : "Total"];
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="hsl(var(--primary))"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
            name="Completion Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

