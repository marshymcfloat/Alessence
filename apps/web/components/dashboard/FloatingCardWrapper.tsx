"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { ChevronLeft, BookOpen } from "lucide-react";
import { Button } from "../ui/button";
import { AnimatePresence, motion } from "framer-motion";

const FloatingCardWrapper = ({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.div
      initial={{ x: -20, opacity: 0 }}
      animate={{
        x: isExpanded ? 20 : 0,
        opacity: 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 30,
        opacity: { duration: 0.3 },
      }}
      className={cn(
        "fixed top-6 left-0 z-40 transition-all duration-300 ease-in-out",
        className
      )}
    >
      <Card
        className={cn(
          "transition-all duration-500 ease-out shadow-2xl",
          "border-2 border-pink-200/30 dark:border-pink-700/30",
          "bg-gradient-to-br from-white/98 via-white/95 to-white/98",
          "dark:from-slate-900/98 dark:via-slate-800/95 dark:to-slate-900/98",
          "backdrop-blur-xl",
          isExpanded
            ? "w-[400px] max-h-[calc(100vh-3rem)] overflow-hidden"
            : "w-14 hover:w-16"
        )}
      >
        <div className="relative h-full">
          <Button
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "absolute z-30 transition-all duration-300",
              "shadow-lg hover:shadow-xl",
              "size-9 rounded-full",
              "bg-gradient-to-br from-pink-500 to-purple-600",
              "dark:from-pink-600 dark:to-purple-700",
              "border-2 border-white/50 dark:border-slate-700/50",
              "hover:scale-110 hover:from-pink-600 hover:to-purple-700",
              "dark:hover:from-pink-700 dark:hover:to-purple-800",
              "text-white",
              isExpanded ? "-right-4 top-5" : "right-2 top-5"
            )}
            variant={"ghost"}
            size="icon"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 0 : 180 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft size={18} className="text-white" />
            </motion.div>
          </Button>

          {/* Expanded Content */}
          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -30, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: -20, scale: 0.95 }}
                transition={{
                  duration: 0.3,
                  ease: [0.4, 0, 0.2, 1],
                }}
                className="h-full flex flex-col"
              >
                <CardHeader className="pb-4 pt-6 px-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center gap-3 pr-8">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 dark:from-pink-600 dark:to-purple-700 shadow-md">
                      <BookOpen className="w-4 h-4 text-white" />
                    </div>
                    <CardTitle className="text-lg font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
                      {title}
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 px-6 pb-6 flex-1 overflow-hidden">
                  {children}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Collapsed Indicator */}
          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="h-full flex flex-col items-center justify-center py-6 cursor-pointer group"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-1.5 h-16 bg-gradient-to-b from-pink-400 via-purple-500 to-blue-500 rounded-full shadow-lg group-hover:from-pink-500 group-hover:via-purple-600 group-hover:to-blue-600 transition-all duration-300 group-hover:shadow-xl group-hover:scale-110" />
              <motion.div
                animate={{
                  y: [0, -4, 0],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="mt-2"
              >
                <BookOpen className="w-4 h-4 text-gray-400 dark:text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default FloatingCardWrapper;
