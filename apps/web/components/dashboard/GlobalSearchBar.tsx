"use client";

import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Search, X, FileText, ClipboardList, File, GraduationCap, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { globalSearch, SearchResult } from "@/lib/actions/searchActions";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function GlobalSearchBar() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => globalSearch(query),
    enabled: query.length > 0 && isFocused,
    staleTime: 30000,
  });

  const results = data?.success ? data.data?.results || [] : [];

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
        setIsFocused(true);
      }
      // ESC to close
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsFocused(false);
        setQuery("");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleResultClick = (result: SearchResult) => {
    setIsOpen(false);
    setIsFocused(false);
    const searchQuery = query;
    setQuery("");

    // Save to search history
    if (searchQuery.trim()) {
      const history = localStorage.getItem("search-history");
      const historyArray = history ? JSON.parse(history) : [];
      const updated = [
        searchQuery,
        ...historyArray.filter((h: string) => h !== searchQuery),
      ].slice(0, 10);
      localStorage.setItem("search-history", JSON.stringify(updated));
    }

    // Navigate based on type
    switch (result.type) {
      case "note":
        router.push(`/notes/${result.id}`);
        break;
      case "task":
        router.push(`/dashboard#task-${result.id}`);
        break;
      case "file":
        router.push(`/files/${result.id}`);
        break;
      case "exam":
        router.push(`/exams/${result.id}`);
        break;
    }
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "note":
        return <FileText className="w-4 h-4" />;
      case "task":
        return <ClipboardList className="w-4 h-4" />;
      case "file":
        return <File className="w-4 h-4" />;
      case "exam":
        return <GraduationCap className="w-4 h-4" />;
    }
  };

  const getResultTypeLabel = (type: SearchResult["type"]) => {
    switch (type) {
      case "note":
        return "Note";
      case "task":
        return "Task";
      case "file":
        return "File";
      case "exam":
        return "Exam";
    }
  };

  return (
    <div ref={searchRef} className="relative flex-1 max-w-2xl mx-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search notes, tasks, files, exams... (⌘K)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setIsFocused(true);
          }}
          className="pl-10 pr-10"
        />
        {query && (
          <button
            onClick={() => {
              setQuery("");
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      <AnimatePresence>
        {isOpen && query.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 w-full z-50"
          >
            <Card className="p-2 max-h-[400px] overflow-y-auto shadow-lg border-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result) => (
                    <motion.button
                      key={`${result.type}-${result.id}`}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full text-left p-3 rounded-md",
                        "hover:bg-muted transition-colors",
                        "flex items-start gap-3"
                      )}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <div className="mt-0.5 text-muted-foreground">
                        {getResultIcon(result.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {result.title}
                          </p>
                          <span className="text-xs text-muted-foreground px-2 py-0.5 rounded bg-muted">
                            {getResultTypeLabel(result.type)}
                          </span>
                        </div>
                        {result.content && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {result.content}
                          </p>
                        )}
                        {result.metadata?.subject && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {result.metadata.subject.title}
                          </p>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    No results found for "{query}"
                  </p>
                </div>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

