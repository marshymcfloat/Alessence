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
import { CheckCircle } from "lucide-react";

interface TaskCompletionChartProps {
  data: TaskCompletionData[];
}

interface TooltipPayloadItem {
  value: number;
  payload: {
    date: string;
    rate: number;
    completed: number;
    total: number;
  };
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0]?.payload;
  if (!data) return null;

  const rateColor = data.rate >= 75 ? "#10B981" : data.rate >= 50 ? "#F59E0B" : "#EF4444";

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[150px]">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle className="w-4 h-4" style={{ color: rateColor }} />
        <span className="text-lg font-bold" style={{ color: rateColor }}>
          {data.rate}%
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {data.completed} of {data.total} tasks
      </p>
    </div>
  );
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
            label={{
              value: "Completion Rate (%)",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>}
          />
          <Line
            type="monotone"
            dataKey="rate"
            stroke="#10B981"
            strokeWidth={2}
            dot={{ r: 4, fill: "#10B981" }}
            activeDot={{ r: 6, fill: "#10B981" }}
            name="Completion Rate"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

