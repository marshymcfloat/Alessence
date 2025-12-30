"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronDown, BookOpen, Lock, Copy, Loader2 } from "lucide-react";
import { SyllabusTree } from "./SyllabusTree";
import { forkSubjectAction } from "@/lib/actions/subjectActions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Subject {
  id: number;
  title: string;
  description: string | null;
  userId: string | null;
}

interface ForkedSubject {
  systemSubjectId: number;
  userSubjectId: number;
}

export default function SyllabusView({ subjects, userId }: { subjects: Subject[], userId: string }) {
  const queryClient = useQueryClient();
  const [expandedSubjects, setExpandedSubjects] = useState<number[]>([]);
  const [forkedSubjects, setForkedSubjects] = useState<ForkedSubject[]>([]);

  const forkMutation = useMutation({
    mutationFn: forkSubjectAction,
    onSuccess: (result, subjectId) => {
      if (result.success && result.data) {
        toast.success("Subject customized! You can now edit your personal copy.");
        setForkedSubjects(prev => [
          ...prev,
          { systemSubjectId: subjectId, userSubjectId: result.data.id }
        ]);
        queryClient.invalidateQueries({ queryKey: ["topics", result.data.id] });
      } else {
        toast.error(result.error || "Failed to customize subject");
      }
    },
    onError: () => {
      toast.error("Failed to customize subject");
    },
  });

  const toggleSubject = (subjectId: number) => {
    if (expandedSubjects.includes(subjectId)) {
      setExpandedSubjects(prev => prev.filter(id => id !== subjectId));
    } else {
      setExpandedSubjects(prev => [...prev, subjectId]);
    }
  };

  const getActiveSubjectId = (subject: Subject): number => {
    // Check if this system subject has been forked
    const forked = forkedSubjects.find(f => f.systemSubjectId === subject.id);
    if (forked) return forked.userSubjectId;
    return subject.id;
  };

  const isSystemSubject = (subject: Subject): boolean => {
    // If it's been forked in this session, it's no longer "system" for display purposes
    const forked = forkedSubjects.find(f => f.systemSubjectId === subject.id);
    if (forked) return false;
    return subject.userId === null;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {subjects.map(subject => {
        const isSystem = isSystemSubject(subject);
        const activeSubjectId = getActiveSubjectId(subject);
        const isForking = forkMutation.isPending && forkMutation.variables === subject.id;

        return (
          <div 
            key={subject.id} 
            className={cn(
              "border rounded-lg p-4 bg-card text-card-foreground shadow-sm flex flex-col",
              isSystem && "border-amber-200 dark:border-amber-900/50"
            )}
          >
            <div 
              className="flex items-center justify-between cursor-pointer hover:bg-accent/50 p-2 rounded-md transition-colors"
              onClick={() => toggleSubject(subject.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-full",
                  isSystem 
                    ? "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400" 
                    : "bg-primary/10 text-primary"
                )}>
                  {isSystem ? <Lock size={20} /> : <BookOpen size={20} />}
                </div>
                <div>
                  <h3 className="font-semibold flex items-center gap-2">
                    {subject.title}
                    {isSystem && (
                      <span className="text-xs font-normal text-amber-600 dark:text-amber-400">
                        (Official)
                      </span>
                    )}
                  </h3>
                  {subject.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1">{subject.description}</p>
                  )}
                </div>
              </div>
              {expandedSubjects.includes(subject.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>

            {expandedSubjects.includes(subject.id) && (
              <div className="mt-4 pt-4 border-t flex-1 flex flex-col">
                {isSystem && (
                  <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-lg">
                    <div className="flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs text-amber-800 dark:text-amber-200">
                          This is the official CPALE syllabus. To add, edit, or generate topics, create your personal copy first.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          className="mt-2 h-8 text-xs border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/50"
                          onClick={(e) => {
                            e.stopPropagation();
                            forkMutation.mutate(subject.id);
                          }}
                          disabled={isForking}
                        >
                          {isForking ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 mr-1.5" />
                              Customize This Subject
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                <SyllabusTree subjectId={activeSubjectId} readOnly={isSystem} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
