"use client";

import { WeakTopic } from "@/lib/actions/progressActions";
import { Card } from "@/components/ui/card";
import { AlertCircle, TrendingDown, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeakAreasCardProps {
  weakAreas: WeakTopic[];
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
            key={area.topicId}
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium">{area.title}</h4>
                <p className="text-xs text-muted-foreground">{area.subject}</p>
              </div>
              <Badge
                variant={area.strength < 40 ? "destructive" : "secondary"}
                className={area.strength < 40 ? "" : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"}
              >
                {Math.round(area.strength)}% Mastery
              </Badge>
            </div>
            
            <div className="mt-3 p-3 bg-muted/50 rounded-md">
              <p className="text-sm">
                <span className="font-medium">Reason: </span>
                {area.reason}
              </p>
              {area.nextReviewAt && (
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <BookOpen className="w-3 h-3" />
                  <span>Review recommended by {new Date(area.nextReviewAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

