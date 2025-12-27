"use client";

import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { logoutAction, getCurrentUser } from "@/lib/actions/authActions";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LoaderCircle } from "lucide-react";
import type { SafeUser } from "@repo/types";

interface UserWithProfile extends SafeUser {
  profilePicture?: string | null;
  bio?: string | null;
}

// Helper function to get initials from name
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2 && parts[0] && parts[parts.length - 1]) {
    const first = parts[0][0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return (first + last).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

const UserButton = () => {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const [mounted, setMounted] = useState(false);

  // Ensure consistent rendering between server and client
  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: userData, isLoading } = useQuery({
    queryKey: ["currentUser"],
    queryFn: async () => {
      const result = await getCurrentUser();
      if (!result.success || !result.data) {
        return null;
      }
      return result.data as UserWithProfile;
    },
    retry: false,
  });

  const { mutate } = useMutation({
    mutationFn: logoutAction,
    onSuccess: (data) => {
      if (!data.success) {
        toast(data.error || "Logging out unsuccessful");
        return;
      }

      toast("logging out");
      router.push("/");
      router.refresh();
    },
  });

  function handleLogginOut() {
    mutate();
  }

  const displayName = String(userData?.name || "User");
  const initials = getInitials(displayName);
  const userEmail = String(userData?.email || "");
  const profilePicture = userData?.profilePicture;

  // Show consistent loading state during SSR and initial hydration
  const showLoading = !mounted || isLoading;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none transition-opacity hover:opacity-90">
        <Avatar className="size-9 border-2 border-white/50">
          {showLoading ? (
            <AvatarFallback className="bg-gray-200 dark:bg-gray-700">
              <LoaderCircle className="size-4 animate-spin" />
            </AvatarFallback>
          ) : (
            <>
              <AvatarImage src={profilePicture || undefined} alt={displayName} />
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 font-bold text-white">
                {initials}
              </AvatarFallback>
            </>
          )}
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push(`/${userId}/profile`)}
        >
          <User className="mr-2 size-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogginOut}
          className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600 dark:focus:bg-red-950"
        >
          <LogOut className="mr-2 size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
