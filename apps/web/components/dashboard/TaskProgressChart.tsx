"use client";

import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from "recharts";

type TaskProgressChartProps = {
  data: {
    done: number;
    onProgress: number;
    planned: number;
  };
};

const TaskProgressChart = ({ data }: TaskProgressChartProps) => {
  const chartData = [
    { name: "Done", value: data.done, color: "hsl(var(--chart-green))" },
    {
      name: "On Progress",
      value: data.onProgress,
      color: "hsl(var(--chart-orange))",
    },
    { name: "Planned", value: data.planned, color: "hsl(var(--chart-slate))" },
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex h-[150px] w-full items-center justify-center">
        <p className="text-sm text-muted-foreground">No task data</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={150}>
      <PieChart>
        <Tooltip
          cursor={{ fill: "hsl(var(--accent))" }}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            borderColor: "hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
        />
        <Pie
          data={chartData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={60}
          innerRadius={40}
          paddingAngle={5}
          labelLine={false}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TaskProgressChart;
