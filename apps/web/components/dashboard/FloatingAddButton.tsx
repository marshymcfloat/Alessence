"use client";

import { Dialog } from "@/components/ui/dialog";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddSubjectDialog from "./AddSubjectDialog";
import AddTaskDialog from "./AddTaskDialog";
import AddExamDialog from "./AddExamDialog";
import AddSummaryDialog from "./AddSummaryDialog";

const menuVariants = {
  open: {
    transition: { staggerChildren: 0.03, delayChildren: 0.05 },
  },
  closed: {
    transition: { staggerChildren: 0.02, staggerDirection: -1 },
  },
};

const menuItemVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100, duration: 0.15 },
      opacity: { duration: 0.15 },
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000, duration: 0.15 },
      opacity: { duration: 0.15 },
    },
  },
};

const FloatingAddButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);
  const [isAddExamDialogOpen, setIsAddExamDialogOpen] = useState(false);
  const [isAddSummaryDialogOpen, setIsAddSummaryDialogOpen] = useState(false);

  const buttonClasses = clsx(
    "fixed bottom-6 right-6 flex items-center justify-center cursor-pointer",
    "bg-slate-800 dark:bg-slate-700",
    "text-white shadow-2xl hover:shadow-3xl overflow-hidden z-50",
    "border-2 border-slate-700/50 dark:border-slate-600/50",
    "hover:bg-slate-700 dark:hover:bg-slate-600",
    "transition-all duration-200"
  );

  return (
    <>
      <motion.div
        layout
        onClick={() => {
          if (!isExpanded) {
            setIsExpanded(true);
          }
        }}
        className={buttonClasses}
        style={{
          borderRadius: isExpanded ? "1rem" : "9999px",
        }}
        initial={{ width: "3.5rem", height: "3.5rem" }}
        animate={{
          width: isExpanded ? "15rem" : "3.5rem",
          height: isExpanded ? "12rem" : "3.5rem",
        }}
        transition={{
          duration: 0.15,
        }}
      >
        <motion.div
          className={`absolute ${isExpanded && "top-2 right-2"}`}
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
        >
          <Plus size={isExpanded ? 18 : 28} />
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              key="menu-content"
              className="flex flex-col items-start p-4 w-full h-full justify-center gap-3"
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
            >
              <motion.span
                className="cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-600/50 p-1 rounded-md px-3 w-full text-left transition-colors duration-150"
                variants={menuItemVariants}
                onClick={() => {
                  setIsAddSubjectDialogOpen(true);
                  setIsExpanded(false);
                }}
              >
                Add Subject
              </motion.span>

              <motion.span
                className="cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-600/50 p-1 rounded-md px-3 w-full text-left transition-colors duration-150"
                variants={menuItemVariants}
                onClick={() => {
                  setIsAddTaskDialogOpen(true);
                  setIsExpanded(false);
                }}
              >
                Add Task
              </motion.span>

              <motion.span
                className="cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-600/50 p-1 rounded-md px-3 w-full text-left transition-colors duration-150"
                variants={menuItemVariants}
                onClick={() => {
                  setIsAddExamDialogOpen(true);
                  setIsExpanded(false);
                }}
              >
                Add Exam
              </motion.span>

              <motion.span
                className="cursor-pointer hover:bg-slate-700/50 dark:hover:bg-slate-600/50 p-1 rounded-md px-3 w-full text-left transition-colors duration-150"
                variants={menuItemVariants}
                onClick={() => {
                  setIsAddSummaryDialogOpen(true);
                  setIsExpanded(false);
                }}
              >
                Add Summary
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Dialog
        open={isAddSubjectDialogOpen}
        onOpenChange={setIsAddSubjectDialogOpen}
      >
        <AddSubjectDialog onClose={() => setIsAddSubjectDialogOpen(false)} />
      </Dialog>

      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <AddTaskDialog onClose={() => setIsAddTaskDialogOpen(false)} />
      </Dialog>

      <Dialog open={isAddExamDialogOpen} onOpenChange={setIsAddExamDialogOpen}>
        <AddExamDialog onClose={() => setIsAddExamDialogOpen(false)} />
      </Dialog>

      <Dialog
        open={isAddSummaryDialogOpen}
        onOpenChange={setIsAddSummaryDialogOpen}
      >
        <AddSummaryDialog onClose={() => setIsAddSummaryDialogOpen(false)} />
      </Dialog>
    </>
  );
};

export default FloatingAddButton;
