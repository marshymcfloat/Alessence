"use client";

import { motion } from "framer-motion";
import { GraduationCap, FileText, Layers, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useQueryState } from "@/hooks/use-query-state";
import ExamsList from "../ExamsList";
import SummariesList from "../SummariesList";
import { FlashcardDeckList } from "../FlashcardDeckList";
import FlashcardDeckForm from "../FlashcardDeckForm";
import AddExamSheet from "../AddExamSheet";
import AddSummarySheet from "../AddSummarySheet";
import CreateMockExamSheet from "../CreateMockExamSheet";

export function StudyTab() {
  const [studySubTab, setStudySubTab] = useQueryState("studyView", {
    defaultValue: "exams",
    parse: (value) => value as "exams" | "summaries" | "flashcards",
  });
  
  const [isNewDeckDialogOpen, setIsNewDeckDialogOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          Study Materials
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Access your exams, summaries, and flashcards
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Sub-navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex gap-2 p-1 bg-muted/50 rounded-full shadow-inner">
            <button
              onClick={() => setStudySubTab("exams")}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                studySubTab === "exams"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Exams</span>
            </button>
            <button
              onClick={() => setStudySubTab("summaries")}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                studySubTab === "summaries"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Summaries</span>
            </button>
            <button
              onClick={() => setStudySubTab("flashcards")}
              className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
                studySubTab === "flashcards"
                  ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25 scale-105"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Flashcards</span>
            </button>
          </div>

          {studySubTab === "flashcards" && (
            <Button
              onClick={() => setIsNewDeckDialogOpen(true)}
              className="gap-2 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white"
            >
              <Plus className="w-4 h-4" />
              Create Deck
            </Button>
          )}
        </div>

        {/* Content Area */}
        <div className="w-full">
          {studySubTab === "exams" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4 gap-2">
                <AddExamSheet />
                <CreateMockExamSheet />
              </div>
              <ExamsList />
            </motion.div>
          )}

          {studySubTab === "summaries" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex justify-between items-center mb-4">
                <AddSummarySheet />
              </div>
              <SummariesList />
            </motion.div>
          )}

          {studySubTab === "flashcards" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <FlashcardDeckList />
            </motion.div>
          )}
        </div>
      </div>

      <Dialog open={isNewDeckDialogOpen} onOpenChange={setIsNewDeckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Flashcard Deck</DialogTitle>
            <DialogDescription>
              Create a new deck to start adding flashcards
            </DialogDescription>
          </DialogHeader>
          <FlashcardDeckForm onSuccess={() => setIsNewDeckDialogOpen(false)} />
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
