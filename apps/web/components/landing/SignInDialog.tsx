"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import AuthLoginForm from "./AuthLoginForm";
import AuthRegisterForm from "./AuthRegisterForm";
import { LogIn, UserPlus } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

const SignInDialog = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 rounded-lg px-8 py-6 text-base font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200">
          <span className="flex items-center gap-2">
            <LogIn className="h-5 w-5" />
            Sign In
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Welcome to Alessence
          </DialogTitle>
          <DialogDescription className="text-center text-sm pt-2">
            Sign in to access your study dashboard
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signin" className="flex items-center gap-2">
              <LogIn className="h-4 w-4" />
              Sign In
            </TabsTrigger>
            <TabsTrigger value="register" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </TabsTrigger>
          </TabsList>
          <TabsContent value="signin" className="mt-4">
            <AuthLoginForm onSuccess={() => setOpen(false)} />
          </TabsContent>
          <TabsContent value="register" className="mt-4">
            <AuthRegisterForm
              onSuccess={() => {
                setActiveTab("signin");
              }}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
