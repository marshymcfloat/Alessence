"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import {
  Save,
  X,
  FileText,
  BookOpen,
  Link as LinkIcon,
  Tags,
} from "lucide-react";
import { CreateNoteTypes, UpdateNoteTypes } from "@repo/types";
import SubjectSelectInput from "./SubjectSelectInput";
import { useQuery } from "@tanstack/react-query";
import { getAllFiles } from "@/lib/actions/fileActionts";
import { getAllTasks } from "@/lib/actions/taskActionts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Note } from "@repo/db";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface NoteEditorProps {
  note?: Note | null;
  onSave: (data: CreateNoteTypes | UpdateNoteTypes) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function NoteEditor({
  note,
  onSave,
  onCancel,
  isLoading = false,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || "");
  const [content, setContent] = useState(note?.content || "");
  const [isMarkdown, setIsMarkdown] = useState(note?.isMarkdown || false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<
    number | undefined
  >(note?.subjectId || undefined);
  const [selectedFileId, setSelectedFileId] = useState<number | undefined>(
    note?.fileId || undefined
  );
  const [selectedTaskId, setSelectedTaskId] = useState<number | undefined>(
    note?.taskId || undefined
  );
  const [previewMode, setPreviewMode] = useState(false);

  const { data: filesData } = useQuery({
    queryKey: ["files"],
    queryFn: getAllFiles,
  });

  const { data: tasksData } = useQuery({
    queryKey: ["tasks"],
    queryFn: getAllTasks,
  });

  const files = filesData?.data?.files || [];
  const tasks = tasksData?.data?.allTasks || [];

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      return;
    }

    const noteData: CreateNoteTypes | UpdateNoteTypes = {
      title: title.trim(),
      content: content.trim(),
      isMarkdown,
      subjectId: selectedSubjectId,
      fileId: selectedFileId,
      taskId: selectedTaskId,
    };

    await onSave(noteData);
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {note ? "Edit Note" : "New Note"}
          </h2>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
              disabled={!isMarkdown}
            >
              {previewMode ? "Edit" : "Preview"}
            </Button>
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isLoading || !title.trim() || !content.trim()}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>

        {/* Title */}
        <div>
          <Label htmlFor="note-title">Title</Label>
          <Input
            id="note-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter note title..."
            className="mt-1"
          />
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="note-content">Content</Label>
            <div className="flex items-center gap-2">
              <Label
                htmlFor="markdown-toggle"
                className="text-sm font-normal cursor-pointer"
              >
                <input
                  id="markdown-toggle"
                  type="checkbox"
                  checked={isMarkdown}
                  onChange={(e) => setIsMarkdown(e.target.checked)}
                  className="mr-2"
                />
                Markdown
              </Label>
            </div>
          </div>
          {previewMode && isMarkdown ? (
            <div className="min-h-[400px] p-4 border rounded-md bg-muted/50 prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <Textarea
              id="note-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing your note..."
              className="min-h-[400px] font-mono text-sm"
            />
          )}
          {isMarkdown && (
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Use Markdown syntax for formatting (e.g., **bold**, *italic*,
              # heading)
            </p>
          )}
        </div>

        {/* Organization */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4" />
              Subject
            </Label>
            <SubjectSelectInput
              value={selectedSubjectId}
              onValueChange={setSelectedSubjectId}
            />
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4" />
              File
            </Label>
            <Select
              value={selectedFileId?.toString() || "none"}
              onValueChange={(value) =>
                setSelectedFileId(value === "none" ? undefined : Number(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a file (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {files.map((file) => (
                  <SelectItem key={file.id} value={file.id.toString()}>
                    {file.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="flex items-center gap-2 mb-2">
              <LinkIcon className="w-4 h-4" />
              Task
            </Label>
            <Select
              value={selectedTaskId?.toString() || "none"}
              onValueChange={(value) =>
                setSelectedTaskId(value === "none" ? undefined : Number(value))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a task (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {tasks.map((task) => (
                  <SelectItem key={task.id} value={task.id.toString()}>
                    {task.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </Card>
  );
}
