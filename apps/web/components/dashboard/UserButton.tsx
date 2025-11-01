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
    <div className="size-10 rounded-full bg-slate-400 hover:bg-slate-400/70 cursor-pointer p-0.5">
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-0!">
          <Image
            src={"/vercel.svg"}
            width={50}
            height={50}
            alt="user logo"
            className="object-contain"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User /> Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleLogginOut}>
            <LogOut /> Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default UserButton;
