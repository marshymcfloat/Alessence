"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  UserPlus,
  Check,
  X,
  Loader2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Inbox,
} from "lucide-react";
import { toast } from "sonner";
import {
  getPendingRequests,
  getSentRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  cancelFriendRequest,
  type FriendRequest,
} from "@/lib/actions/friendshipActions";
import { formatDistanceToNow } from "date-fns";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    return ((parts[0][0] ?? "") + (parts[parts.length - 1]?.[0] ?? "")).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

export default function FriendRequests() {
  const queryClient = useQueryClient();

  const { data: pendingRequests, isLoading: loadingPending } = useQuery({
    queryKey: ["pendingRequests"],
    queryFn: async () => {
      const result = await getPendingRequests();
      if (!result.success) return [];
      return result.data!;
    },
  });

  const { data: sentRequests, isLoading: loadingSent } = useQuery({
    queryKey: ["sentRequests"],
    queryFn: async () => {
      const result = await getSentRequests();
      if (!result.success) return [];
      return result.data!;
    },
  });

  const acceptMutation = useMutation({
    mutationFn: acceptFriendRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Friend request accepted!");
        queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
        queryClient.invalidateQueries({ queryKey: ["friends"] });
        queryClient.invalidateQueries({ queryKey: ["friendshipCounts"] });
      } else {
        toast.error(result.error || "Failed to accept request");
      }
    },
  });

  const rejectMutation = useMutation({
    mutationFn: rejectFriendRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Friend request rejected");
        queryClient.invalidateQueries({ queryKey: ["pendingRequests"] });
        queryClient.invalidateQueries({ queryKey: ["friendshipCounts"] });
      } else {
        toast.error(result.error || "Failed to reject request");
      }
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: (result) => {
      if (result.success) {
        toast.success("Request cancelled");
        queryClient.invalidateQueries({ queryKey: ["sentRequests"] });
        queryClient.invalidateQueries({ queryKey: ["friendshipCounts"] });
      } else {
        toast.error(result.error || "Failed to cancel request");
      }
    },
  });

  const renderEmptyState = (type: "received" | "sent") => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Inbox className="mb-4 size-12 text-muted-foreground/50" />
      <p className="text-muted-foreground">
        {type === "received"
          ? "No pending friend requests"
          : "No sent requests"}
      </p>
    </div>
  );

  const renderRequest = (request: FriendRequest, type: "received" | "sent") => {
    const user = type === "received" ? request.requester : request.addressee;
    const isPending =
      acceptMutation.isPending ||
      rejectMutation.isPending ||
      cancelMutation.isPending;

    return (
      <Card key={request.id} className="overflow-hidden">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border-2 border-primary/10">
              <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
              <AvatarFallback className="bg-gradient-to-br from-orange-500 to-amber-600 font-semibold text-white">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground/70">
                <Clock className="size-3" />
                {formatDistanceToNow(new Date(request.createdAt), {
                  addSuffix: true,
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {type === "received" ? (
              <>
                <Button
                  size="sm"
                  onClick={() => acceptMutation.mutate(request.id)}
                  disabled={isPending}
                  className="gap-1"
                >
                  {acceptMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Check className="size-4" />
                  )}
                  Accept
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => rejectMutation.mutate(request.id)}
                  disabled={isPending}
                  className="gap-1"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <X className="size-4" />
                  )}
                  Decline
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => cancelMutation.mutate(request.id)}
                disabled={isPending}
                className="gap-1"
              >
                {cancelMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <X className="size-4" />
                )}
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Tabs defaultValue="received" className="space-y-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="received" className="gap-2">
          <ArrowDownLeft className="size-4" />
          Received
          {pendingRequests && pendingRequests.length > 0 && (
            <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
              {pendingRequests.length}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="sent" className="gap-2">
          <ArrowUpRight className="size-4" />
          Sent
          {sentRequests && sentRequests.length > 0 && (
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {sentRequests.length}
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="received" className="space-y-3">
        {loadingPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : pendingRequests && pendingRequests.length > 0 ? (
          pendingRequests.map((req) => renderRequest(req, "received"))
        ) : (
          renderEmptyState("received")
        )}
      </TabsContent>

      <TabsContent value="sent" className="space-y-3">
        {loadingSent ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : sentRequests && sentRequests.length > 0 ? (
          sentRequests.map((req) => renderRequest(req, "sent"))
        ) : (
          renderEmptyState("sent")
        )}
      </TabsContent>
    </Tabs>
  );
}

