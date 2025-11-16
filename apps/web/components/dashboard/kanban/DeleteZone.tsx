"use client";

import { useDroppable } from "@dnd-kit/core";
import { Trash2 } from "lucide-react";

interface DeleteZoneProps {
  isOver: boolean;
}

export function DeleteZone({ isOver }: DeleteZoneProps) {
  const { setNodeRef } = useDroppable({
    id: "delete-zone",
    data: {
      type: "DeleteZone",
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`fixed bottom-28 right-4 z-50 flex items-center justify-center w-16 h-16 rounded-full transition-all duration-200 ${
        isOver
          ? "bg-red-500 scale-110 shadow-lg shadow-red-500/50"
          : "bg-red-400/80 hover:bg-red-500/90"
      }`}
    >
      <Trash2
        className={`w-6 h-6 text-white transition-transform ${
          isOver ? "scale-110" : ""
        }`}
      />
    </div>
  );
}

