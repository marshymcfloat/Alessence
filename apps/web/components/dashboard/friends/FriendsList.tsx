"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Users,
  MoreHorizontal,
  UserMinus,
  Share2,
  Loader2,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { getFriends, removeFriend, type Friend } from "@/lib/actions/friendshipActions";
import { formatDistanceToNow } from "date-fns";
import { ShareWithFriendDialog } from "./ShareWithFriendDialog";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return ((parts[0][0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function FriendsList() {
  const queryClient = useQueryClient();
  const [friendToRemove, setFriendToRemove] = useState<Friend | null>(null);
  const [friendToShareWith, setFriendToShareWith] = useState<Friend | null>(null);

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: async () => {
      const result = await getFriends();
      if (!result.success) return [];
      return result.data!;
    },
  });

  const removeMutation = useMutation({
    mutationFn: removeFriend,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Friend removed");
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["friendshipCounts"] });
      } else {
        toast.error(result.error || "Failed to remove friend");
      }
      setFriendToRemove(null);
    },
  });

  const handleRemoveFriend = () => {
    if (friendToRemove) {
      removeMutation.mutate(friendToRemove.friendshipId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!friends || friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Users className="mb-4 size-16 text-muted-foreground/50" />
        <h3 className="text-lg font-medium">No friends yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Search for users and send friend requests to connect!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {friends.map((friend) => (
          <Card key={friend.id} className="overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar className="size-12 border-2 border-primary/10">
                  <AvatarImage src={friend.profilePicture || undefined} alt={friend.name} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 font-semibold text-white">
                    {getInitials(friend.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{friend.name}</p>
                  <p className="text-sm text-muted-foreground">{friend.email}</p>
                  <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                    <Calendar className="size-3" />
                    Friends {formatDistanceToNow(new Date(friend.friendsSince), { addSuffix: true })}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={() => setFriendToShareWith(friend)}
                >
                  <Share2 className="size-4" />
                  Share
                </Button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost">
                      <MoreHorizontal className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => setFriendToRemove(friend)}
                    >
                      <UserMinus className="mr-2 size-4" />
                      Remove Friend
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <AlertDialog open={!!friendToRemove} onOpenChange={() => setFriendToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Friend</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-medium">{friendToRemove?.name}</span> from your
              friends? You will no longer be able to share content with them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveFriend}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeMutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <UserMinus className="mr-2 size-4" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {friendToShareWith && (
        <ShareWithFriendDialog
          open={!!friendToShareWith}
          onOpenChange={(open) => !open && setFriendToShareWith(null)}
          friend={friendToShareWith}
        />
      )}
    </>
  );
}

