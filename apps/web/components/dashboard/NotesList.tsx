"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllNotes, deleteNoteAction } from "@/lib/actions/noteActions";
import { getNotesSharedWithMe, type SharedNoteItem } from "@/lib/actions/sharingActions";
import type { Note } from "@repo/db";

type NoteWithRelations = Note & {
  subject?: { id: number; title: string } | null;
  file?: { id: number; name: string } | null;
  task?: { id: number; title: string } | null;
};
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import {
  FileText,
  Edit,
  Trash2,
  Search,
  BookOpen,
  Link as LinkIcon,
  Calendar,
  Users,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

interface NotesListProps {
  onEditNote: (note: Note) => void;
  onCreateNote: () => void;
}

export function NotesList({ onEditNote, onCreateNote }: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("my-notes");
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ["notes", searchQuery],
    queryFn: () => getAllNotes(searchQuery || undefined),
  });

  const { data: sharedData, isLoading: isLoadingShared } = useQuery({
    queryKey: ["shared-notes"],
    queryFn: getNotesSharedWithMe,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteNoteAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
      toast.success("Note deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete note");
    },
  });

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure you want to delete this note?")) {
      await deleteMutation.mutateAsync(id);
    }
  };

  const notes = data?.success ? data.data?.notes || [] : [];
  const sharedNotes = sharedData?.success ? sharedData.data || [] : [];

  const renderMyNotes = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error || !data?.success) {
      return (
        <Card className="p-6">
          <p className="text-sm text-muted-foreground text-center py-4">
            Failed to load notes
          </p>
        </Card>
      );
    }

    if (notes.length === 0) {
      return (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            {searchQuery ? "No notes found" : "No notes yet"}
          </p>
          {!searchQuery && (
            <Button variant="outline" onClick={onCreateNote} className="mt-4">
              Create your first note
            </Button>
          )}
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map((note: NoteWithRelations) => (
          <motion.div
            key={note.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            <Card className="p-4 h-full flex flex-col hover:shadow-lg transition-shadow cursor-pointer group">
              <div
                className="flex-1"
                onClick={() => onEditNote(note)}
              >
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {note.title}
                </h3>
                <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {note.isMarkdown ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {note.content.substring(0, 150) +
                          (note.content.length > 150 ? "..." : "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    note.content.substring(0, 150) +
                    (note.content.length > 150 ? "..." : "")
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mt-auto pt-3 border-t">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {note.subject && (
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      {note.subject.title}
                    </div>
                  )}
                  {note.file && (
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {note.file.name}
                    </div>
                  )}
                  {note.task && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      {note.task.title}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(note.updatedAt), {
                      addSuffix: true,
                    })}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditNote(note);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(note.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderSharedNotes = () => {
    if (isLoadingShared) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (sharedNotes.length === 0) {
      return (
        <Card className="p-12 text-center">
          <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground mb-2">
            No shared notes yet
          </p>
          <p className="text-xs text-muted-foreground">
            When friends share notes with you, they&apos;ll appear here
          </p>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sharedNotes.map((item: SharedNoteItem) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full"
          >
            <Card className="p-4 h-full flex flex-col hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {item.note.title}
                </h3>
                <div className="text-sm text-muted-foreground mb-3 line-clamp-3">
                  {item.note.isMarkdown ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {item.note.content.substring(0, 150) +
                          (item.note.content.length > 150 ? "..." : "")}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    item.note.content.substring(0, 150) +
                    (item.note.content.length > 150 ? "..." : "")
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="space-y-2 mt-auto pt-3 border-t">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="gap-1">
                    <Users className="w-3 h-3" />
                    {item.owner.name}
                  </Badge>
                  <Badge variant={item.permission === "COPY" ? "default" : "secondary"}>
                    {item.permission === "COPY" ? "Can Copy" : "View Only"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  Shared {formatDistanceToNow(new Date(item.createdAt), {
                    addSuffix: true,
                  })}
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Search and Create */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={onCreateNote}>
          <FileText className="w-4 h-4 mr-2" />
          New Note
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="my-notes" className="gap-2">
            <FileText className="w-4 h-4" />
            My Notes ({notes.length})
          </TabsTrigger>
          <TabsTrigger value="shared" className="gap-2">
            <Users className="w-4 h-4" />
            Shared with Me ({sharedNotes.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-notes" className="mt-4">
          {renderMyNotes()}
        </TabsContent>

        <TabsContent value="shared" className="mt-4">
          {renderSharedNotes()}
        </TabsContent>
      </Tabs>
    </div>
  );
}

