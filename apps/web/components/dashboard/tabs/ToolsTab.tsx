"use client";

import { motion } from "framer-motion";
import { Calculator, Scale } from "lucide-react";
import { useQueryState } from "nuqs";
import DrillMode from "../DrillMode";
import LawTools from "../LawTools";

export function ToolsTab() {
  const [toolsSubTab, setToolsSubTab] = useQueryState("toolView", {
    defaultValue: "drills",
    parse: (value) => value as "drills" | "law",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent mb-2">
          Study Tools
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Specialized tools for nursing students and future lawyers
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex justify-center gap-2">
          <button
            onClick={() => setToolsSubTab("drills")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              toolsSubTab === "drills"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>Accounting Drills</span>
          </button>
          <button
            onClick={() => setToolsSubTab("law")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all ${
              toolsSubTab === "law"
                ? "bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg shadow-pink-500/25"
                : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Law Reference</span>
          </button>
        </div>

        <div className="w-full">
          {toolsSubTab === "drills" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <DrillMode />
            </motion.div>
          )}

          {toolsSubTab === "law" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              <LawTools />
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
