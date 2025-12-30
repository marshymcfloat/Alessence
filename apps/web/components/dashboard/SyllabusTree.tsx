"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTopicsAction,
  createTopicAction,
  deleteTopicAction,
  generateSubTopicsAction,
  type Topic,
} from "@/lib/actions/subjectActions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, Plus, Trash2, Folder, FolderOpen, File, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";

export function SyllabusTree({ subjectId, readOnly }: { subjectId: number; readOnly?: boolean }) {
  const queryClient = useQueryClient();
  const [isAddingRoot, setIsAddingRoot] = useState(false);
  const [newTopicTitle, setNewTopicTitle] = useState("");
  const [generatingId, setGeneratingId] = useState<number | null>(null);

  const { data: topics, isLoading } = useQuery({
    queryKey: ["topics", subjectId],
    queryFn: async () => {
      const result = await getTopicsAction(subjectId);
      return result.success ? result.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async ({ title, parentId }: { title: string; parentId?: number }) => {
      return createTopicAction({ title, subjectId, parentId, order: 0 });
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Topic added");
        setNewTopicTitle("");
        setIsAddingRoot(false);
        queryClient.invalidateQueries({ queryKey: ["topics", subjectId] });
      } else {
        toast.error(result.error);
      }
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTopicAction,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Topic deleted");
        queryClient.invalidateQueries({ queryKey: ["topics", subjectId] });
      } else {
        toast.error(result.error);
      }
    },
  });

  const generateMutation = useMutation({
    mutationFn: generateSubTopicsAction,
    onMutate: (id) => setGeneratingId(id),
    onSettled: () => setGeneratingId(null),
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Sub-topics generated!");
        queryClient.invalidateQueries({ queryKey: ["topics", subjectId] });
      } else {
        toast.error(result.error);
      }
    },
  });

  const handleAddRoot = () => {
    if (!newTopicTitle.trim()) return;
    createMutation.mutate({ title: newTopicTitle });
  };

  if (isLoading) return <div className="text-sm text-muted-foreground p-4">Loading syllabus...</div>;

  return (
    <div className="border rounded-xl p-4 bg-white/50 dark:bg-slate-900/50 relative">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-pink-500" />
          Syllabus Map
        </h4>
        {!readOnly && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-xs"
            onClick={() => setIsAddingRoot(!isAddingRoot)}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Add Topic
          </Button>
        )}
      </div>

      <div className="space-y-1">
        {!readOnly && isAddingRoot && (
          <div className="flex items-center gap-2 mb-2 px-2">
            <Input
              value={newTopicTitle}
              onChange={(e) => setNewTopicTitle(e.target.value)}
              placeholder="New Topic Title..."
              className="h-8 text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleAddRoot()}
            />
            <Button size="sm" onClick={handleAddRoot} className="h-8">Add</Button>
          </div>
        )}

        {topics?.length === 0 && !isAddingRoot && (
          <p className="text-xs text-muted-foreground text-center py-4 italic">
            No topics yet. Start mapping your syllabus!
          </p>
        )}

        {topics?.map((topic) => (
          <TopicItem
            key={topic.id}
            topic={topic}
            onAdd={(parentId, title) => createMutation.mutate({ title, parentId })}
            onDelete={(id) => deleteMutation.mutate(id)}
            onGenerate={(id) => generateMutation.mutate(id)}
            isGenerating={generatingId === topic.id}
            level={0}
            readOnly={readOnly}
          />
        ))}
      </div>
    </div>
  );
}

function TopicItem({
  topic,
  onAdd,
  onDelete,
  onGenerate,
  isGenerating,
  level,
  readOnly,
}: {
  topic: Topic;
  onAdd: (parentId: number, title: string) => void;
  onDelete: (id: number) => void;
  onGenerate: (id: number) => void;
  isGenerating: boolean;
  level: number;
  readOnly?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");

  const hasChildren = topic.children && topic.children.length > 0;

  // Auto-open if children are added (e.g. after generation)
  if (hasChildren && !isOpen && isGenerating) {
      // Logic handled by useEffect or parent state would be better, but for now simple local state
  }

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAdd(topic.id, newTitle);
    setNewTitle("");
    setIsAdding(false);
    setIsOpen(true); // Open to show new child
  };

  return (
    <div className="select-none">
      <div
        className={cn(
          "group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer",
          level > 0 && "ml-4 border-l border-slate-200 dark:border-slate-800"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className={cn(
            "p-0.5 rounded-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
            !hasChildren && "opacity-0 pointer-events-none"
          )}
        >
          {isOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          )}
        </button>

        <div className="flex-1 flex items-center gap-2" onClick={() => setIsOpen(!isOpen)}>
          {hasChildren ? (
            <Folder className="w-4 h-4 text-blue-500 fill-blue-500/20" />
          ) : (
            <File className="w-4 h-4 text-slate-400" />
          )}
          <span className="text-sm font-medium">{topic.title}</span>
        </div>

        {!readOnly && (
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
            {isGenerating ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500 mx-2" />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                title="Auto-generate subtopics"
                onClick={(e) => {
                  e.stopPropagation();
                  onGenerate(topic.id);
                  setIsOpen(true); 
                }}
              >
                <Sparkles className="w-3.5 h-3.5" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => {
                e.stopPropagation();
                setIsAdding(!isAdding);
                setIsOpen(true);
              }}
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(topic.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            {!readOnly && isAdding && (
              <div className="flex items-center gap-2 my-1 ml-9 pr-2">
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Subtopic..."
                  className="h-7 text-xs"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                />
                <Button size="sm" onClick={handleAdd} className="h-7 text-xs px-2">Save</Button>
              </div>
            )}
            {topic.children?.map((child) => (
              <TopicItem
                key={child.id}
                topic={child}
                onAdd={onAdd}
                onDelete={onDelete}
                onGenerate={onGenerate}
                isGenerating={isGenerating} 
                level={level + 1}
                readOnly={readOnly}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
