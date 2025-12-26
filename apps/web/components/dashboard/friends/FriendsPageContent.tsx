"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Search, Clock } from "lucide-react";
import UserSearch from "./UserSearch";
import FriendsList from "./FriendsList";
import FriendRequests from "./FriendRequests";
import { useQuery } from "@tanstack/react-query";
import { getFriendshipCounts } from "@/lib/actions/friendshipActions";

export default function FriendsPageContent() {
  const [activeTab, setActiveTab] = useState("friends");

  const { data: counts } = useQuery({
    queryKey: ["friendshipCounts"],
    queryFn: async () => {
      const result = await getFriendshipCounts();
      if (!result.success) return { friends: 0, pendingReceived: 0, pendingSent: 0 };
      return result.data!;
    },
  });

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Friends</h1>
        <p className="mt-2 text-muted-foreground">
          Connect with other students and share your study materials
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          <TabsTrigger value="friends" className="flex items-center gap-2">
            <Users className="size-4" />
            <span>Friends</span>
            {counts && counts.friends > 0 && (
              <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                {counts.friends}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <UserPlus className="size-4" />
            <span>Requests</span>
            {counts && counts.pendingReceived > 0 && (
              <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-medium text-white">
                {counts.pendingReceived}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="search" className="flex items-center gap-2">
            <Search className="size-4" />
            <span>Find</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends" className="space-y-4">
          <FriendsList />
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <FriendRequests />
        </TabsContent>

        <TabsContent value="search" className="space-y-4">
          <UserSearch />
        </TabsContent>
      </Tabs>
    </div>
  );
}

