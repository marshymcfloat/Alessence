"use client";

import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip } from "recharts";
import { Card } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { getGamificationStats } from "@/lib/actions/progressActions";
import { Loader2 } from "lucide-react";

export function MasteryRadar() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["gamification-stats"],
    queryFn: async () => {
      const result = await getGamificationStats();
      return result.success ? result.data : null;
    },
    staleTime: 60000,
  });

  if (isLoading) {
    return (
      <Card className="p-6 flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </Card>
    );
  }

  if (!stats || !stats.mastery || stats.mastery.length === 0) {
    return (
      <Card className="p-6 flex flex-col items-center justify-center min-h-[300px] text-center">
        <h3 className="text-lg font-semibold mb-2">No Mastery Data Yet</h3>
        <p className="text-muted-foreground text-sm max-w-xs">
          Complete practice exams to see your subject competency visualization.
        </p>
      </Card>
    );
  }

  // Format data for Recharts
  // Recharts needs 'fullMark' for proper scaling usually, but domain={[0, 100]} on PolarRadiusAxis works too
  const data = stats.mastery.map(m => ({
    subject: m.subject,
    score: Math.round(m.score),
    fullMark: 100,
  }));

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
          Subject Mastery
        </h3>
        <p className="text-sm text-muted-foreground">
          Your competency across different subjects based on exam performance
        </p>
      </div>
      
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
            <PolarGrid className="stroke-muted/20" />
            <PolarAngleAxis 
              dataKey="subject" 
              tick={{ fill: 'currentColor', fontSize: 12 }} 
              className="text-muted-foreground text-[10px] sm:text-xs"
            />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
            <Radar
              name="Competency"
              dataKey="score"
              stroke="#0ea5e9"
              fill="#0ea5e9"
              fillOpacity={0.3}
            />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

