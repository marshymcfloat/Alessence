"use client";

import { LogOut } from "lucide-react";
import { Button } from "./ui/button";
import { logoutAction } from "@/lib/actions/authActions";

const LogoutButton = () => {
  return (
    <Button onClick={logoutAction}>
      <LogOut />
      Logout
    </Button>
  );
};

export default LogoutButton;
