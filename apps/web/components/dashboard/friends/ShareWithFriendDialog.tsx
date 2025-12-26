"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  StickyNote,
  Layers,
  Share2,
  Loader2,
  Check,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import { getAllFiles } from "@/lib/actions/fileActionts";
import { getAllNotes } from "@/lib/actions/noteActions";
import { getAllDecks } from "@/lib/actions/flashcardActions";
import {
  shareFile,
  shareNote,
  shareDeck,
} from "@/lib/actions/sharingActions";
import { type Friend } from "@/lib/actions/friendshipActions";

interface ShareWithFriendDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  friend: Friend;
}

type ShareableItem = {
  id: number;
  name: string;
  type: "file" | "note" | "deck";
};

export function ShareWithFriendDialog({
  open,
  onOpenChange,
  friend,
}: ShareWithFriendDialogProps) {
  const [activeTab, setActiveTab] = useState<"files" | "notes" | "decks">("files");
  const [selectedItems, setSelectedItems] = useState<ShareableItem[]>([]);
  const [permission, setPermission] = useState<"VIEW" | "COPY">("VIEW");
  const queryClient = useQueryClient();

  // Fetch user's files
  const { data: files, isLoading: loadingFiles } = useQuery({
    queryKey: ["allFiles"],
    queryFn: async () => {
      const result = await getAllFiles();
      if (!result.success || !result.data) return [];
      return result.data.files || [];
    },
    enabled: open,
  });

  // Fetch user's notes
  const { data: notes, isLoading: loadingNotes } = useQuery({
    queryKey: ["allNotes"],
    queryFn: async () => {
      const result = await getAllNotes();
      if (!result.success || !result.data) return [];
      return result.data.notes || [];
    },
    enabled: open,
  });

  // Fetch user's flashcard decks
  const { data: decks, isLoading: loadingDecks } = useQuery({
    queryKey: ["allDecks"],
    queryFn: async () => {
      const result = await getAllDecks();
      if (!result.success || !result.data) return [];
      return result.data.decks || [];
    },
    enabled: open,
  });

  const shareMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.all(
        selectedItems.map(async (item) => {
          switch (item.type) {
            case "file":
              return shareFile(item.id, friend.id, permission);
            case "note":
              return shareNote(item.id, friend.id, permission);
            case "deck":
              return shareDeck(item.id, friend.id, permission);
          }
        })
      );
      return results;
    },
    onSuccess: (results) => {
      const successCount = results.filter((r) => r.success).length;
      if (successCount === selectedItems.length) {
        toast.success(`Shared ${successCount} item(s) with ${friend.name}!`);
      } else if (successCount > 0) {
        toast.warning(`Shared ${successCount} of ${selectedItems.length} items`);
      } else {
        toast.error("Failed to share items");
      }
      queryClient.invalidateQueries({ queryKey: ["sharedSummary"] });
      onOpenChange(false);
      setSelectedItems([]);
    },
    onError: () => {
      toast.error("Failed to share");
    },
  });

  const toggleItem = (item: ShareableItem) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.id === item.id && i.type === item.type);
      if (exists) {
        return prev.filter((i) => !(i.id === item.id && i.type === item.type));
      }
      return [...prev, item];
    });
  };

  const isSelected = (id: number, type: "file" | "note" | "deck") => {
    return selectedItems.some((i) => i.id === id && i.type === type);
  };

  const handleShare = () => {
    if (selectedItems.length > 0) {
      shareMutation.mutate();
    }
  };

  const renderEmptyState = (type: string) => (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <Inbox className="mb-2 size-10 text-muted-foreground/50" />
      <p className="text-sm text-muted-foreground">No {type} to share</p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="flex justify-center py-8">
      <Loader2 className="size-6 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Share with {friend.name}
          </DialogTitle>
          <DialogDescription>
            Select content to share with your friend
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "files" | "notes" | "decks")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="files" className="gap-1">
              <FileText className="size-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="notes" className="gap-1">
              <StickyNote className="size-4" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="decks" className="gap-1">
              <Layers className="size-4" />
              Decks
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="mt-4 h-64">
            <TabsContent value="files" className="m-0">
              {loadingFiles ? (
                renderLoadingState()
              ) : !files || files.length === 0 ? (
                renderEmptyState("files")
              ) : (
                <div className="space-y-2">
                  {files.map((file) => (
                    <button
                      key={file.id}
                      onClick={() => toggleItem({ id: file.id, name: file.name, type: "file" })}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        isSelected(file.id, "file")
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="size-5 text-blue-500" />
                        <span className="text-sm font-medium">{file.name}</span>
                      </div>
                      {isSelected(file.id, "file") && (
                        <Check className="size-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="notes" className="m-0">
              {loadingNotes ? (
                renderLoadingState()
              ) : !notes || notes.length === 0 ? (
                renderEmptyState("notes")
              ) : (
                <div className="space-y-2">
                  {notes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => toggleItem({ id: note.id, name: note.title, type: "note" })}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        isSelected(note.id, "note")
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <StickyNote className="size-5 text-green-500" />
                        <span className="text-sm font-medium">{note.title}</span>
                      </div>
                      {isSelected(note.id, "note") && (
                        <Check className="size-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="decks" className="m-0">
              {loadingDecks ? (
                renderLoadingState()
              ) : !decks || decks.length === 0 ? (
                renderEmptyState("decks")
              ) : (
                <div className="space-y-2">
                  {decks.map((deck) => (
                    <button
                      key={deck.id}
                      onClick={() => toggleItem({ id: deck.id, name: deck.title, type: "deck" })}
                      className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                        isSelected(deck.id, "deck")
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="size-5 text-purple-500" />
                        <div>
                          <span className="text-sm font-medium">{deck.title}</span>
                          {deck.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {deck.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {isSelected(deck.id, "deck") && (
                        <Check className="size-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        {/* Selected items summary */}
        {selectedItems.length > 0 && (
          <div className="flex flex-wrap gap-2 border-t pt-4">
            {selectedItems.map((item) => (
              <Badge
                key={`${item.type}-${item.id}`}
                variant="secondary"
                className="cursor-pointer hover:bg-destructive/20"
                onClick={() => toggleItem(item)}
              >
                {item.type === "file" && <FileText className="mr-1 size-3" />}
                {item.type === "note" && <StickyNote className="mr-1 size-3" />}
                {item.type === "deck" && <Layers className="mr-1 size-3" />}
                {item.name.length > 20 ? item.name.substring(0, 20) + "..." : item.name}
                <span className="ml-1 text-muted-foreground">×</span>
              </Badge>
            ))}
          </div>
        )}

        {/* Permission and share button */}
        <div className="flex items-center justify-between gap-3 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Permission:</span>
            <Select value={permission} onValueChange={(v) => setPermission(v as "VIEW" | "COPY")}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="VIEW">View</SelectItem>
                <SelectItem value="COPY">Copy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleShare}
            disabled={selectedItems.length === 0 || shareMutation.isPending}
          >
            {shareMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 size-4" />
                Share ({selectedItems.length})
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

