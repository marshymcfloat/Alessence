"use client";

import { Dialog } from "@/components/ui/dialog";
import clsx from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useState } from "react";
import AddSubjectDialog from "./AddSubjectDialog";
import AddTaskDialog from "./AddTaskDialog";

const menuVariants = {
  open: {
    transition: { staggerChildren: 0.07, delayChildren: 0.2 },
  },
  closed: {
    transition: { staggerChildren: 0.05, staggerDirection: -1 },
  },
};

const menuItemVariants = {
  open: {
    y: 0,
    opacity: 1,
    transition: {
      y: { stiffness: 1000, velocity: -100 },
    },
  },
  closed: {
    y: 50,
    opacity: 0,
    transition: {
      y: { stiffness: 1000 },
    },
  },
};

const FloatingAddButton = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isAddSubjectDialogOpen, setIsAddSubjectDialogOpen] = useState(false);
  const [isAddTaskDialogOpen, setIsAddTaskDialogOpen] = useState(false);

  const buttonClasses = clsx(
    "fixed bottom-4 right-4 flex items-center justify-center cursor-pointer",
    "bg-neutral-900 text-white shadow-xl overflow-hidden z-50"
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
          height: isExpanded ? "8rem" : "3.5rem",
        }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
        }}
      >
        <motion.div
          className={`absolute ${isExpanded && "top-2 right-2"}`}
          animate={{ rotate: isExpanded ? 45 : 0 }}
          transition={{ duration: 0.3 }}
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
                className="cursor-pointer hover:bg-neutral-700 p-1 rounded-md px-3 w-full text-left"
                variants={menuItemVariants}
                onClick={() => {
                  setIsAddSubjectDialogOpen(true);
                  setIsExpanded(false);
                }}
              >
                Add Subject
              </motion.span>

              <motion.span
                className="cursor-pointer hover:bg-neutral-700 p-1 rounded-md px-3 w-full text-left"
                variants={menuItemVariants}
                onClick={() => {
                  setIsAddTaskDialogOpen(true);
                  setIsExpanded(false);
                }}
              >
                Add task
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <Dialog
        open={isAddSubjectDialogOpen}
        onOpenChange={setIsAddSubjectDialogOpen}
      >
        <AddSubjectDialog />
      </Dialog>

      <Dialog open={isAddTaskDialogOpen} onOpenChange={setIsAddTaskDialogOpen}>
        <AddTaskDialog />
      </Dialog>
    </>
  );
};

export default FloatingAddButton;
