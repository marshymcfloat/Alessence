"use client";

import { cn } from "@/lib/utils";
import { ChevronLeft, BookOpen, Menu } from "lucide-react";
import { Button } from "../ui/button";
import { AnimatePresence, motion } from "framer-motion";
import EnrolledSubjectContent from "./EnrolledSubjectContent";
import { useSidebar } from "./SidebarContext";
import { SubjectWithTaskProgress } from "@repo/types";

const DashboardSidebar = ({
  subjects,
}: {
  subjects?: SubjectWithTaskProgress[];
}) => {
  const { isExpanded, setIsExpanded } = useSidebar();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{
        width: isExpanded ? "320px" : "80px",
        opacity: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.3 },
      }}
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] z-30",
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl",
        "border-r-2 border-gray-200/50 dark:border-gray-800/50",
        "shadow-2xl"
      )}
    >
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="h-16 border-b border-gray-200/50 dark:border-gray-800/50 flex items-center justify-between px-4">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded-header"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 shadow-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-800 dark:text-gray-100">
                    Subjects
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Your courses
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-header"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center w-full"
              >
                <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 shadow-md">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <Button
            onClick={() => setIsExpanded((prev) => !prev)}
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 rounded-lg",
              "hover:bg-gray-100 dark:hover:bg-slate-800",
              "transition-all duration-200"
            )}
          >
            {isExpanded ? (
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden ">
          <AnimatePresence mode="wait">
            {isExpanded ? (
              <motion.div
                key="expanded-content"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto custom-scrollbar "
              >
                <div className="p-4">
                  <EnrolledSubjectContent data={subjects} />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center "
                onClick={() => setIsExpanded(true)}
              >
                <div className="w-1 h-20 bg-gradient-to-b from-pink-400 via-purple-500 to-blue-500 rounded-full shadow-lg cursor-pointer hover:scale-110 transition-transform" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #ec4899, #a855f7);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #db2777, #9333ea);
        }
      `}</style>
    </motion.aside>
  );
};

export default DashboardSidebar;
