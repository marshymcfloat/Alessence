"use client";

import { useState } from "react";
import { NotesList } from "./NotesList";
import { NoteEditor } from "./NoteEditor";
import type { Note } from "@repo/db";
import { CreateNoteTypes, UpdateNoteTypes } from "@repo/types";
import {
  createNoteAction,
  updateNoteAction,
} from "@/lib/actions/noteActions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

export function NotesSection() {
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async (data: CreateNoteTypes | UpdateNoteTypes) => {
    setIsSaving(true);
    try {
      if (editingNote) {
        const result = await updateNoteAction(editingNote.id, data);
        if (result.success) {
          toast.success("Note updated successfully");
          setEditingNote(null);
          setIsCreating(false);
          queryClient.invalidateQueries({ queryKey: ["notes"] });
        } else {
          toast.error(result.error || "Failed to update note");
        }
      } else {
        const result = await createNoteAction(data as CreateNoteTypes);
        if (result.success) {
          toast.success("Note created successfully");
          setIsCreating(false);
          queryClient.invalidateQueries({ queryKey: ["notes"] });
        } else {
          toast.error(result.error || "Failed to create note");
        }
      }
    } catch (error) {
      toast.error("An error occurred while saving the note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingNote(null);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setEditingNote(null);
    setIsCreating(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsCreating(false);
  };

  const isEditorOpen = isCreating || editingNote !== null;

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {isEditorOpen ? (
          <motion.div
            key="editor"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <NoteEditor
              note={editingNote}
              onSave={handleSave}
              onCancel={handleCancel}
              isLoading={isSaving}
            />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <NotesList
              onEditNote={handleEdit}
              onCreateNote={handleCreate}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

