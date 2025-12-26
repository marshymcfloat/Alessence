"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  UserPlus,
  Clock,
  Check,
  Users,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchUsers,
  sendFriendRequest,
  cancelFriendRequest,
  type UserSearchResult,
} from "@/lib/actions/friendshipActions";
import { useDebounce } from "@/hooks/useDebounce";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return ((parts[0][0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function UserSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ["userSearch", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];
      const result = await searchUsers(debouncedQuery);
      if (!result.success) return [];
      return result.data!;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const sendRequestMutation = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Friend request sent!");
        queryClient.invalidateQueries({ queryKey: ["userSearch"] });
        queryClient.invalidateQueries({ queryKey: ["friendshipCounts"] });
        queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      } else {
        toast.error(result.error || "Failed to send request");
      }
    },
  });

  const cancelRequestMutation = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Request cancelled");
        queryClient.invalidateQueries({ queryKey: ["userSearch"] });
        queryClient.invalidateQueries({ queryKey: ["friendshipCounts"] });
        queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
      } else {
        toast.error(result.error || "Failed to cancel request");
      }
    },
  });

  const handleSendRequest = useCallback(
    (userId: string) => {
      sendRequestMutation.mutate(userId);
    },
    [sendRequestMutation]
  );

  const handleCancelRequest = useCallback(
    (friendshipId: number) => {
      cancelRequestMutation.mutate(friendshipId);
    },
    [cancelRequestMutation]
  );

  const renderActionButton = (user: UserSearchResult) => {
    const isPending =
      sendRequestMutation.isPending || cancelRequestMutation.isPending;

    switch (user.friendshipStatus) {
      case "none":
        return (
          <Button
            size="sm"
            onClick={() => handleSendRequest(user.id)}
            disabled={isPending}
            className="gap-1"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <UserPlus className="size-4" />
            )}
            Add Friend
          </Button>
        );
      case "pending_sent":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleCancelRequest(user.friendshipId!)}
            disabled={isPending}
            className="gap-1"
          >
            {isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <X className="size-4" />
            )}
            Cancel Request
          </Button>
        );
      case "pending_received":
        return (
          <Badge variant="secondary" className="gap-1">
            <Clock className="size-3" />
            Pending
          </Badge>
        );
      case "friends":
        return (
          <Badge className="gap-1 bg-green-500 hover:bg-green-600">
            <Check className="size-3" />
            Friends
          </Badge>
        );
      case "blocked":
        return (
          <Badge variant="destructive" className="gap-1">
            Blocked
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {searchQuery.length > 0 && searchQuery.length < 2 && (
        <p className="text-center text-sm text-muted-foreground">
          Type at least 2 characters to search
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && users && users.length === 0 && debouncedQuery.length >= 2 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Users className="mb-4 size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">No users found</p>
          <p className="text-sm text-muted-foreground/70">
            Try searching with a different name or email
          </p>
        </div>
      )}

      {users && users.length > 0 && (
        <div className="space-y-3">
          {users.map((user) => (
            <Card key={user.id} className="overflow-hidden">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-12 border-2 border-primary/10">
                    <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 font-semibold text-white">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                </div>
                {renderActionButton(user)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!searchQuery && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="mb-4 size-12 text-muted-foreground/50" />
          <p className="text-muted-foreground">Find your study buddies</p>
          <p className="text-sm text-muted-foreground/70">
            Search for users by their name or email address
          </p>
        </div>
      )}
    </div>
  );
}

