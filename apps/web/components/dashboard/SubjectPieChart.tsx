"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { SubjectWithTaskProgress } from "@repo/types";

const COLORS = {
  done: "#10B981",
  onProgress: "#00C49F",
  planned: "#F9A825",
};

type TaskCounts = SubjectWithTaskProgress["taskCounts"];

const CustomLegend = (props: any) => {
  const { taskCounts } = props;
  const total = taskCounts.total;

  const allCategories = [
    { name: "Done", value: taskCounts.done, color: COLORS.done },
    {
      name: "In Progress",
      value: taskCounts.onProgress,
      color: COLORS.onProgress,
    },
    { name: "Planned", value: taskCounts.planned, color: COLORS.planned },
  ];

  return (
    <div className="mt-4 flex flex-col gap-y-2">
      {allCategories.map((entry, index) => {
        const percentage =
          total === 0 ? 0 : Math.round((entry.value / total) * 100);

        return (
          <div key={`item-${index}`} className="flex items-center text-sm">
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="ml-2 flex-1 text-gray-600">{entry.name}</span>
            <span className="font-medium text-gray-800">{percentage}%</span>
          </div>
        );
      })}
    </div>
  );
};

const SubjectPieChart = ({ taskCounts }: { taskCounts: TaskCounts }) => {
  const activeChartData = [
    { name: "Done", value: taskCounts.done, color: COLORS.done },
    {
      name: "In Progress",
      value: taskCounts.onProgress,
      color: COLORS.onProgress,
    },
    { name: "Planned", value: taskCounts.planned, color: COLORS.planned },
  ].filter((item) => item.value > 0);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Tooltip
          cursor={{ fill: "transparent" }}
          contentStyle={{
            backgroundColor: "white",
            borderRadius: "0.5rem",
            border: "1px solid #e2e8f0",
          }}
        />

        {}
        {taskCounts.total === 0 ? (
          <Pie
            data={[{ value: 1 }]}
            dataKey="value"
            cx="50%"
            cy="45%"
            outerRadius={50}
            innerRadius={35}
            fill="#E5E7EB"
          />
        ) : (
          <Pie
            data={activeChartData}
            cx="50%"
            cy="45%"
            labelLine={false}
            outerRadius={50}
            innerRadius={35}
            paddingAngle={activeChartData.length > 1 ? 5 : 0}
            dataKey="value"
            nameKey="name"
          >
            {activeChartData.map((entry) => (
              <Cell
                key={`cell-${entry.name}`}
                fill={entry.color}
                stroke="none"
              />
            ))}
          </Pie>
        )}

        <Legend
          content={<CustomLegend taskCounts={taskCounts} />}
          verticalAlign="bottom"
          wrapperStyle={{ paddingTop: "15px" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SubjectPieChart;
