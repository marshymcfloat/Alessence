"use client";

import { SubjectWithTaskProgress } from "@repo/types";
import SubjectAccordion from "./SubjectAccordion";
import { Accordion } from "@/components/ui/accordion";
import { BookOpen, Plus } from "lucide-react";
import { motion } from "framer-motion";

const EnrolledSubjectContent = ({
  data,
}: {
  data: SubjectWithTaskProgress[] | undefined;
}) => {
  if (!data || data.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center py-12 px-4"
      >
        <div className="flex flex-col items-center gap-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.3 }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 dark:from-pink-900/30 dark:via-purple-900/30 dark:to-blue-900/30 flex items-center justify-center shadow-lg"
          >
            <BookOpen className="w-10 h-10 text-gradient-to-r from-pink-500 to-purple-600 dark:from-pink-400 dark:to-purple-500" />
          </motion.div>
          <div className="space-y-2">
            <p className="text-base font-semibold text-gray-700 dark:text-gray-200">
              No subjects enrolled yet
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
              Get started by adding your first subject to organize your tasks
              and studies
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 text-white text-sm font-medium shadow-md hover:shadow-lg transition-shadow"
          >
            <Plus className="w-4 h-4" />
            <span>Add Subject</span>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-h-[calc(100vh-14rem)] overflow-y-auto overflow-x-hidden pr-2 custom-scrollbar">
      <Accordion type="single" collapsible className="w-full space-y-3">
        {data?.map((subject, index) => (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              delay: index * 0.05,
              duration: 0.3,
              ease: [0.4, 0, 0.2, 1],
            }}
          >
            <SubjectAccordion subject={subject} />
          </motion.div>
        ))}
      </Accordion>
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
    </div>
  );
};

export default EnrolledSubjectContent;
