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
import { Clock } from "lucide-react";

interface StudyTimeChartProps {
  data: StudyTimeData[];
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  payload: {
    date: string;
    hours: number;
    sessions: number;
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

  return (
    <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3 min-w-[150px]">
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{label}</p>
      <div className="flex items-center gap-2 mb-1">
        <Clock className="w-4 h-4 text-pink-500" />
        <span className="text-lg font-bold text-pink-600 dark:text-pink-400">
          {data.hours}h
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {data.sessions} session{data.sessions !== 1 ? "s" : ""}
      </p>
    </div>
  );
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
          <defs>
            <linearGradient id="studyTimeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EC4899" stopOpacity={0.4} />
              <stop offset="95%" stopColor="#EC4899" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
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
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            formatter={(value) => <span className="text-sm text-gray-600 dark:text-gray-400">{value}</span>}
          />
          <Area
            type="monotone"
            dataKey="hours"
            stroke="#EC4899"
            strokeWidth={2}
            fill="url(#studyTimeGradient)"
            name="Study Time"
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  );
}

