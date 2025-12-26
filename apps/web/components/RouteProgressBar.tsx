"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function RouteProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const previousPath = useRef(pathname);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startProgress = useCallback(() => {
    setIsNavigating(true);
    setProgress(0);

    // Simulate progress
    let currentProgress = 0;
    intervalRef.current = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress > 90) {
        currentProgress = 90;
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
      setProgress(currentProgress);
    }, 100);
  }, []);

  const completeProgress = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setProgress(100);

    timeoutRef.current = setTimeout(() => {
      setIsNavigating(false);
      setProgress(0);
    }, 200);
  }, []);

  useEffect(() => {
    // Check if pathname changed
    if (pathname !== previousPath.current) {
      previousPath.current = pathname;
      completeProgress();
    }
  }, [pathname, searchParams, completeProgress]);

  // Intercept link clicks to start progress
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest("a");
      
      if (link) {
        const href = link.getAttribute("href");
        const isInternal = href?.startsWith("/") || href?.startsWith("#");
        const isSameOrigin = link.origin === window.location.origin;
        const isNotNewTab = link.target !== "_blank";
        
        if (isInternal && isSameOrigin && isNotNewTab && href !== pathname) {
          startProgress();
        }
      }
    };

    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [pathname, startProgress]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[9999] h-1"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
            className="h-full bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 shadow-lg shadow-purple-500/50"
          />
          {/* Glow effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-white/50 to-transparent"
            style={{ right: `${100 - progress}%` }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

