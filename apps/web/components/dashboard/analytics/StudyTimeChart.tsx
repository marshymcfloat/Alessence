"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { StudyTimeData } from "@/lib/actions/analyticsActions";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

interface StudyTimeChartProps {
  data: StudyTimeData[];
}

export function StudyTimeChart({ data }: StudyTimeChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No study time data available
          </p>
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    hours: Math.round((item.duration / 3600) * 100) / 100,
    sessions: item.sessionCount,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Study Time Analytics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            label={{ value: "Hours", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--background))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "0.5rem",
            }}
            formatter={(value: number, name: string) => {
              if (name === "hours") {
                return [`${value} hours`, "Study Time"];
              }
              return [value, "Sessions"];
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.3}
            name="Study Time"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

