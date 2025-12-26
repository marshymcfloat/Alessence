"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FileText,
  StickyNote,
  Layers,
  Share2,
  Download,
  Copy,
  ExternalLink,
  Loader2,
  Inbox,
  Eye,
} from "lucide-react";
import {
  getFilesSharedWithMe,
  getNotesSharedWithMe,
  getDecksSharedWithMe,
  getSharedSummary,
  copySharedDeck,
} from "@/lib/actions/sharingActions";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import Link from "next/link";
import { useParams } from "next/navigation";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return ((parts[0][0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function SharedWithMeContent() {
  const params = useParams();
  const dashboardId = params.id as string;
  const [activeTab, setActiveTab] = useState("files");

  const { data: summary } = useQuery({
    queryKey: ["sharedSummary"],
    queryFn: async () => {
      const result = await getSharedSummary();
      if (!result.success) return { files: 0, notes: 0, decks: 0, total: 0 };
      return result.data!;
    },
  });

  const { data: sharedFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ["sharedFiles"],
    queryFn: async () => {
      const result = await getFilesSharedWithMe();
      if (!result.success) return [];
      return result.data!;
    },
  });

  const { data: sharedNotes, isLoading: loadingNotes } = useQuery({
    queryKey: ["sharedNotes"],
    queryFn: async () => {
      const result = await getNotesSharedWithMe();
      if (!result.success) return [];
      return result.data!;
    },
  });

  const { data: sharedDecks, isLoading: loadingDecks } = useQuery({
    queryKey: ["sharedDecks"],
    queryFn: async () => {
      const result = await getDecksSharedWithMe();
      if (!result.success) return [];
      return result.data!;
    },
  });

  const handleCopyDeck = async (shareId: number) => {
    const result = await copySharedDeck(shareId);
    if (result.success) {
      toast.success("Deck copied to your collection!");
    } else {
      toast.error(result.error || "Failed to copy deck");
    }
  };

  const renderEmptyState = (type: string) => (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="mb-4 size-16 text-muted-foreground/50" />
      <h3 className="text-lg font-medium">No shared {type} yet</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        When friends share {type} with you, they&apos;ll appear here
      </p>
    </div>
  );

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
          <Share2 className="size-8 text-primary" />
          Shared with Me
        </h1>
        <p className="mt-2 text-muted-foreground">
          Content that friends have shared with you
        </p>
      </div>

      {/* Summary cards */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
              <FileText className="size-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.files || 0}</p>
              <p className="text-sm text-muted-foreground">Files</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/30">
              <StickyNote className="size-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.notes || 0}</p>
              <p className="text-sm text-muted-foreground">Notes</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
              <Layers className="size-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary?.decks || 0}</p>
              <p className="text-sm text-muted-foreground">Decks</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="files" className="gap-2">
            <FileText className="size-4" />
            Files
            {summary && summary.files > 0 && (
              <Badge variant="secondary" className="ml-1">
                {summary.files}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notes" className="gap-2">
            <StickyNote className="size-4" />
            Notes
            {summary && summary.notes > 0 && (
              <Badge variant="secondary" className="ml-1">
                {summary.notes}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="decks" className="gap-2">
            <Layers className="size-4" />
            Decks
            {summary && summary.decks > 0 && (
              <Badge variant="secondary" className="ml-1">
                {summary.decks}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* FILES TAB */}
        <TabsContent value="files" className="mt-6 space-y-4">
          {loadingFiles ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sharedFiles && sharedFiles.length > 0 ? (
            sharedFiles.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                      <FileText className="size-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium">{item.file.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="size-5">
                          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] text-white">
                            {getInitials(item.owner.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>Shared by {item.owner.name}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Eye className="size-3" />
                      {item.permission === "COPY" ? "Can copy" : "View"}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                      <a href={item.file.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="mr-1 size-4" />
                        Open
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            renderEmptyState("files")
          )}
        </TabsContent>

        {/* NOTES TAB */}
        <TabsContent value="notes" className="mt-6 space-y-4">
          {loadingNotes ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sharedNotes && sharedNotes.length > 0 ? (
            sharedNotes.map((item) => (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="rounded-lg bg-green-100 p-3 dark:bg-green-900/30">
                        <StickyNote className="size-6 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="font-medium">{item.note.title}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.note.content.substring(0, 150)}...
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                          <Avatar className="size-5">
                            <AvatarFallback className="bg-gradient-to-br from-green-500 to-teal-600 text-[10px] text-white">
                              {getInitials(item.owner.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span>Shared by {item.owner.name}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="gap-1">
                      <Eye className="size-3" />
                      {item.permission === "COPY" ? "Can copy" : "View"}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            renderEmptyState("notes")
          )}
        </TabsContent>

        {/* DECKS TAB */}
        <TabsContent value="decks" className="mt-6 space-y-4">
          {loadingDecks ? (
            <div className="flex justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : sharedDecks && sharedDecks.length > 0 ? (
            sharedDecks.map((item) => (
              <Card key={item.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-4">
                    <div className="rounded-lg bg-purple-100 p-3 dark:bg-purple-900/30">
                      <Layers className="size-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium">{item.deck.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.deck._count.cards} cards
                      </p>
                      <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                        <Avatar className="size-5">
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-600 text-[10px] text-white">
                            {getInitials(item.owner.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span>Shared by {item.owner.name}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-1">
                      <Eye className="size-3" />
                      {item.permission === "COPY" ? "Can copy" : "View"}
                    </Badge>
                    {item.permission === "COPY" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCopyDeck(item.id)}
                      >
                        <Copy className="mr-1 size-4" />
                        Copy to My Decks
                      </Button>
                    )}
                    <Button size="sm" asChild>
                      <Link href={`/${dashboardId}/flashcard/deck/${item.deck.id}`}>
                        Study
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            renderEmptyState("flashcard decks")
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

