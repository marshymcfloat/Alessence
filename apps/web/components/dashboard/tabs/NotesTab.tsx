"use client";

import { useState } from "react";
import { NotesList } from "../NotesList";
import { NoteEditor } from "../NoteEditor";
import { createNoteAction, updateNoteAction } from "@/lib/actions/noteActions";
import { Note } from "@repo/db";
import { CreateNoteTypes, UpdateNoteTypes } from "@repo/types";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export function NotesTab() {
  const [isEditing, setIsEditing] = useState(false);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleCreateNote = () => {
    setActiveNote(null);
    setIsEditing(true);
  };

  const handleEditNote = (note: Note) => {
    setActiveNote(note);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setActiveNote(null);
  };

  const handleSave = async (data: CreateNoteTypes | UpdateNoteTypes) => {
    setIsSaving(true);
    try {
      let result;
      if (activeNote) {
        result = await updateNoteAction(activeNote.id, data as UpdateNoteTypes);
      } else {
        result = await createNoteAction(data as CreateNoteTypes);
      }

      if (result.success) {
        toast.success(result.message);
        queryClient.invalidateQueries({ queryKey: ["notes"] });
        setIsEditing(false);
        setActiveNote(null);
      } else {
        toast.error(result.error || "Failed to save note");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <NoteEditor
        note={activeNote}
        onSave={handleSave}
        onCancel={handleCancel}
        isLoading={isSaving}
      />
    );
  }

  return (
    <NotesList
      onEditNote={handleEditNote}
      onCreateNote={handleCreateNote}
    />
  );
}
