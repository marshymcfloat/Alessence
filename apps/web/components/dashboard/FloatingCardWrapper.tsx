"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { ChevronLeft } from "lucide-react";
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
      initial={{ x: isExpanded ? 10 : 10 }}
      animate={{ x: isExpanded ? 10 : 10 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={cn(
        "fixed top-4 left-0 z-10 transition-all duration-300 ease-in-out",
        className
      )}
    >
      <Card
        className={cn(
          "transition-all duration-300 ease-in-out shadow-xl border border-gray-200/50 dark:border-gray-700/50",
          isExpanded
            ? "w-[360px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md"
            : "w-12 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm hover:bg-white/95 dark:hover:bg-slate-800/95"
        )}
      >
        <div className="relative">
          <Button
            onClick={() => setIsExpanded((prev) => !prev)}
            className={cn(
              "absolute z-20 transition-all duration-300 shadow-md",
              "size-8 rounded-full bg-white dark:bg-slate-700 border-2 border-gray-200 dark:border-gray-600",
              "hover:bg-gray-50 dark:hover:bg-slate-600 hover:scale-110",
              isExpanded ? "-right-3 top-4" : "right-2 top-4"
            )}
            variant={"ghost"}
            size="icon"
          >
            {isExpanded ? (
              <ChevronLeft
                size={16}
                className="text-gray-600 dark:text-gray-300"
              />
            ) : (
              <ChevronLeft
                size={16}
                className="text-gray-600 dark:text-gray-300 rotate-180"
              />
            )}
          </Button>

          <AnimatePresence mode="wait">
            {isExpanded && (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -0 }}
                transition={{ duration: 0.2 }}
                className="pr-4"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-100 pr-6">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">{children}</CardContent>
              </motion.div>
            )}
          </AnimatePresence>

          {!isExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex items-center justify-center py-4 cursor-pointer"
              onClick={() => setIsExpanded(true)}
            >
              <div className="w-1 h-12 bg-linear-to-b from-pink-400 to-purple-400 rounded-full hover:from-pink-500 hover:to-purple-500 transition-colors" />
            </motion.div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default FloatingCardWrapper;
