"use client";

import { ReactNode } from "react";

interface ScrollableContainerProps {
  children: ReactNode;
  className?: string;
}

const ScrollableContainer = ({ children, className = "" }: ScrollableContainerProps) => {
  return (
    <>
      <div className={`custom-scrollbar ${className}`}>
        {children}
      </div>
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
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
    </>
  );
};

export default ScrollableContainer;

