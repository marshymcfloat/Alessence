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
        className="fixed inset-0 z-[9999] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-8">
          {/* Header Controls */}
          <div className="absolute top-4 right-4 flex gap-2 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFullscreen}
              className="text-white/70 hover:text-white hover:bg-white/10"
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
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Timer Display */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-2xl"
          >
            <div className="bg-black/20 backdrop-blur-xl rounded-3xl border border-white/10 p-8 shadow-2xl [&_*]:text-white [&_button]:border-white/20 [&_button]:text-white [&_button:hover]:bg-white/10">
              <PomodoroTimer />
            </div>
          </motion.div>

          {/* Motivational Text */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="mt-8 text-center"
          >
            <p className="text-white/60 text-sm font-medium">
              Stay focused. You've got this.
            </p>
          </motion.div>

          {/* Keyboard Shortcut Hint */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
            className="absolute bottom-8 text-center"
          >
            <p className="text-white/40 text-xs">
              Press <kbd className="px-2 py-1 bg-white/10 rounded text-xs">ESC</kbd> to exit focus mode
            </p>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
