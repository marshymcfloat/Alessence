"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PomodoroTimer } from "./PomodoroTimer";

interface FocusModeProps {
  isOpen: boolean;
  onClose: () => void;
}

export function FocusMode({ isOpen, onClose }: FocusModeProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when focus mode is active
      document.body.style.overflow = "hidden";
      
      // Try to enter fullscreen if supported
      const enterFullscreen = async () => {
        try {
          if (document.documentElement.requestFullscreen) {
            await document.documentElement.requestFullscreen();
            setIsFullscreen(true);
          }
        } catch (error) {
          console.log("Fullscreen not available:", error);
        }
      };
      
      enterFullscreen();
    } else {
      document.body.style.overflow = "";
      
      // Exit fullscreen if active
      if (isFullscreen && document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isFullscreen]);

  useEffect(() => {
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  // Handle ESC key to exit
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.log("Fullscreen toggle failed:", error);
    }
  };


  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center text-white"
      >
        {/* Header Controls */}
        <div className="absolute top-6 right-6 flex gap-4 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-full"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/40 hover:text-white hover:bg-white/10 rounded-full"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Timer Display */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-xl px-6"
        >
           <PomodoroTimer minimal={true} />
        </motion.div>

        {/* Keyboard Shortcut Hint */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute bottom-10 text-center"
        >
          <p className="text-white/20 text-xs tracking-widest uppercase font-medium">
            Press <span className="text-white/40">ESC</span> to exit
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
