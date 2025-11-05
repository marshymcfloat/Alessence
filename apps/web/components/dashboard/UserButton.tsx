"use client";
import Image from "next/image";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User } from "lucide-react";
import { logoutAction } from "@/lib/actions/authActions";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { redirect, useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const UserButton = () => {
  const router = useRouter();

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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer rounded-full outline-none transition-opacity hover:opacity-90">
        {/* ✨ Replaced the generic Image with a proper Avatar component */}
        <Avatar className="size-9 border-2 border-white/50">
          {/* This will show if you have a user image URL */}
          <AvatarImage src="https://github.com/shadcn.png" alt="@user" />
          {/* This is a fallback with the user's initials */}
          <AvatarFallback className="bg-blue-500 font-bold text-white">
            JD
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      {/* ✨ Added w-56 for a slightly wider, more modern dropdown */}
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="cursor-pointer">
          <User className="mr-2 size-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogginOut}
          className="cursor-pointer text-red-500 focus:bg-red-50 focus:text-red-600"
        >
          <LogOut className="mr-2 size-4" />
          <span>Logout</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
