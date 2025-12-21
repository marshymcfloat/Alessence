"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { globalSearch, SearchResult } from "@/lib/actions/searchActions";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FileText,
  ClipboardList,
  File,
  GraduationCap,
  Search,
  Filter,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem("search-history");
    if (history) {
      try {
        setSearchHistory(JSON.parse(history));
      } catch (e) {
        // Ignore parse errors
      }
    }
  }, []);

  // Save to search history
  const saveToHistory = (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    const updated = [
      searchQuery,
      ...searchHistory.filter((h) => h !== searchQuery),
    ].slice(0, 10); // Keep last 10
    setSearchHistory(updated);
    localStorage.setItem("search-history", JSON.stringify(updated));
  };

  const { data, isLoading } = useQuery({
    queryKey: ["global-search", query],
    queryFn: () => globalSearch(query),
    enabled: query.length > 0,
  });

  const results = data?.success ? data.data?.results || [] : [];
  const filteredResults =
    typeFilter === "all"
      ? results
      : results.filter((r) => r.type === typeFilter);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    saveToHistory(searchQuery);
    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
  };

  const getResultIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "note":
        return <FileText className="w-5 h-5" />;
      case "task":
        return <ClipboardList className="w-5 h-5" />;
      case "file":
        return <File className="w-5 h-5" />;
      case "exam":
        return <GraduationCap className="w-5 h-5" />;
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

  const handleResultClick = (result: SearchResult) => {
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

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 via-pink-600 to-purple-600 dark:from-gray-100 dark:via-pink-400 dark:to-purple-400 bg-clip-text text-transparent">
            Search
          </h1>

          {/* Search Bar */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="Search notes, tasks, files, exams..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSearch(query);
                  }
                }}
                className="pl-10 text-lg h-12"
              />
            </div>
            <Button onClick={() => handleSearch(query)} size="lg">
              Search
            </Button>
          </div>

          {/* Filters */}
          {query && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Filter:</span>
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="note">Notes</SelectItem>
                  <SelectItem value="task">Tasks</SelectItem>
                  <SelectItem value="file">Files</SelectItem>
                  <SelectItem value="exam">Exams</SelectItem>
                </SelectContent>
              </Select>
              {typeFilter !== "all" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTypeFilter("all")}
                >
                  <X className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          )}

          {/* Search History */}
          {!query && searchHistory.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Recent Searches</p>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((historyItem, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    onClick={() => handleSearch(historyItem)}
                  >
                    {historyItem}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Results */}
        {query && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-4"
          >
            {isLoading ? (
              <Card className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-4">
                  Searching...
                </p>
              </Card>
            ) : filteredResults.length > 0 ? (
              <>
                <p className="text-sm text-muted-foreground">
                  Found {filteredResults.length} result
                  {filteredResults.length !== 1 ? "s" : ""}
                </p>
                <div className="space-y-3">
                  {filteredResults.map((result) => (
                    <motion.div
                      key={`${result.type}-${result.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card
                        className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleResultClick(result)}
                      >
                        <div className="flex items-start gap-4">
                          <div className="mt-1 text-primary">
                            {getResultIcon(result.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg">
                                {result.title}
                              </h3>
                              <Badge variant="secondary">
                                {getResultTypeLabel(result.type)}
                              </Badge>
                            </div>
                            {result.content && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {result.content}
                              </p>
                            )}
                            {result.metadata?.subject && (
                              <p className="text-xs text-muted-foreground">
                                Subject: {result.metadata.subject.title}
                              </p>
                            )}
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </>
            ) : (
              <Card className="p-12 text-center">
                <Search className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  No results found for "{query}"
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Try different keywords or check your spelling
                </p>
              </Card>
            )}
          </motion.div>
        )}

        {/* Empty State */}
        {!query && (
          <Card className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">Start searching</p>
            <p className="text-sm text-muted-foreground">
              Search across all your notes, tasks, files, and exams
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

