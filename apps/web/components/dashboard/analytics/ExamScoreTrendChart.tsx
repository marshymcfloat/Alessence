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
import { ExamScoreTrend } from "@/lib/actions/analyticsActions";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { TrendingUp } from "lucide-react";

interface ExamScoreTrendChartProps {
  data: ExamScoreTrend[];
}

interface TooltipPayloadItem {
  value: number;
  color: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const score = payload[0]?.value ?? 0;
  const scoreColor = score >= 75 ? "#10B981" : score >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[140px]">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4" style={{ color: scoreColor }} />
        <span className="text-lg font-bold" style={{ color: scoreColor }}>
          {score}%
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Exam Score</p>
    </div>
  );
}

export function ExamScoreTrendChart({ data }: ExamScoreTrendChartProps) {
  if (data.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex h-[300px] items-center justify-center">
          <p className="text-sm text-muted-foreground">
            No exam data available
          </p>
        </div>
      </Card>
    );
  }

  const chartData = data.map((item) => ({
    date: format(new Date(item.date), "MMM dd"),
    score: item.score,
    fullDate: item.date,
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Exam Score Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
            label={{ value: "Score (%)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#8B5CF6"
            strokeWidth={2}
            dot={{ r: 4, fill: "#8B5CF6" }}
            activeDot={{ r: 6, fill: "#8B5CF6" }}
            name="Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

