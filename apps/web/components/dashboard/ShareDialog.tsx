"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Share2, Loader2, Check, Users } from "lucide-react";
import { toast } from "sonner";
import { getFriends, type Friend } from "@/lib/actions/friendshipActions";
import {
  shareFile,
  shareNote,
  shareDeck,
} from "@/lib/actions/sharingActions";
import { useDebounce } from "@/hooks/useDebounce";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return ((parts[0][0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemType: "file" | "note" | "deck";
  itemId: number;
  itemName: string;
}

export function ShareDialog({
  open,
  onOpenChange,
  itemType,
  itemId,
  itemName,
}: ShareDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [permission, setPermission] = useState<"VIEW" | "COPY">("VIEW");
  const debouncedQuery = useDebounce(searchQuery, 200);
  const queryClient = useQueryClient();

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const result = await getFriends();
      if (!result.success) return [];
      return result.data!;
    },
  });

  const filteredFriends = friends?.filter(
    (friend) =>
      friend.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      friend.email.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  const shareMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFriend) throw new Error("No friend selected");

      switch (itemType) {
        case "file":
          return shareFile(itemId, selectedFriend.id, permission);
        case "note":
          return shareNote(itemId, selectedFriend.id, permission);
        case "deck":
          return shareDeck(itemId, selectedFriend.id, permission);
      }
    },
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`${itemType.charAt(0).toUpperCase() + itemType.slice(1)} shared successfully!`);
        queryClient.invalidateQueries({ queryKey: ["sharedSummary"] });
        onOpenChange(false);
        setSelectedFriend(null);
        setSearchQuery("");
      } else {
        toast.error(result.error || "Failed to share");
      }
    },
    onError: () => {
      toast.error("Failed to share");
    },
  });

  const handleShare = useCallback(() => {
    if (selectedFriend) {
      shareMutation.mutate();
    }
  }, [selectedFriend, shareMutation]);

  const itemTypeLabels = {
    file: "File",
    note: "Note",
    deck: "Flashcard Deck",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Share {itemTypeLabels[itemType]}
          </DialogTitle>
          <DialogDescription>
            Share <span className="font-medium">&quot;{itemName}&quot;</span> with a friend
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Search friends */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Selected friend */}
          {selectedFriend && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="size-10">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                    {getInitials(selectedFriend.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedFriend.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedFriend.email}</p>
                </div>
              </div>
              <Badge variant="secondary" className="gap-1">
                <Check className="size-3" />
                Selected
              </Badge>
            </div>
          )}

          {/* Friends list */}
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : filteredFriends && filteredFriends.length > 0 ? (
              filteredFriends
                .filter((f) => f.id !== selectedFriend?.id)
                .map((friend) => (
                  <button
                    key={friend.id}
                    onClick={() => setSelectedFriend(friend)}
                    className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-muted"
                  >
                    <Avatar className="size-9">
                      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-sm text-white">
                        {getInitials(friend.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{friend.name}</p>
                      <p className="text-xs text-muted-foreground">{friend.email}</p>
                    </div>
                  </button>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <Users className="mb-2 size-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? "No friends found" : "Add friends to share content"}
                </p>
              </div>
            )}
          </div>

          {/* Permission selector */}
          {selectedFriend && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">Permission:</span>
              <Select value={permission} onValueChange={(v) => setPermission(v as "VIEW" | "COPY")}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIEW">View only</SelectItem>
                  <SelectItem value="COPY">Can copy</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Share button */}
          <Button
            onClick={handleShare}
            disabled={!selectedFriend || shareMutation.isPending}
            className="w-full"
          >
            {shareMutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="mr-2 size-4" />
                Share with {selectedFriend?.name || "friend"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

