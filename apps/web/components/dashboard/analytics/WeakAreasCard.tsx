"use client";

import { WeakArea } from "@/lib/actions/analyticsActions";
import { Card } from "@/components/ui/card";
import { AlertCircle, TrendingDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeakAreasCardProps {
  weakAreas: WeakArea[];
}

export function WeakAreasCard({ weakAreas }: WeakAreasCardProps) {
  if (weakAreas.length === 0) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <TrendingDown className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Weak Areas</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Great job! No weak areas identified. Keep up the excellent work!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <AlertCircle className="w-5 h-5 text-destructive" />
        <h3 className="text-lg font-semibold">Areas Needing Improvement</h3>
      </div>
      <div className="space-y-4">
        {weakAreas.map((area) => (
          <div
            key={area.subjectId}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium">{area.subjectTitle}</h4>
              <Badge variant="destructive">
                {Math.round(area.averageScore)}% avg
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {area.examCount} exam{area.examCount !== 1 ? "s" : ""} completed
            </p>
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Recommendation: </span>
                {area.recommendation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

