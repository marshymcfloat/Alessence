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
import { LogIn, UserPlus, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

const SignInDialog = () => {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("signin");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="relative group overflow-hidden rounded-full px-8 py-6 shadow-[0_0_20px_rgba(0,0,0,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] transition-all duration-300 bg-slate-900 border border-slate-700">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <span className="relative flex items-center gap-2 text-base font-semibold text-white">
            <LogIn className="h-5 w-5 group-hover:scale-110 transition-transform duration-300" />
            <span className="tracking-wide">Sign In</span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="!p-0 overflow-hidden !rounded-3xl gap-0 grid grid-cols-1 md:grid-cols-2 bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl border-slate-200 dark:border-slate-800/50 shadow-2xl dark:shadow-[0_0_50px_rgba(0,0,0,0.5)] md:max-w-4xl sm:max-w-md transition-colors duration-300 max-h-[90vh]">
        {/* Left Column - Visual (Desktop Only) */}
        <div className="relative hidden md:flex flex-col items-center justify-center p-12 overflow-hidden bg-slate-50 dark:bg-slate-900 h-full min-h-[600px] transition-colors duration-300">
          {/* Animated Background */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-200/40 via-slate-50 to-slate-50 dark:from-indigo-500/20 dark:via-slate-900 dark:to-slate-900 transition-colors duration-300" />
            <div className="absolute -top-20 -left-20 w-80 h-80 bg-indigo-200/30 dark:bg-purple-500/30 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-200/30 dark:bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-100/50 dark:bg-indigo-500/20 rounded-full blur-3xl animate-pulse delay-700" />
          </div>

          <div className="relative z-10 flex flex-col items-center text-center space-y-6">
            <div className="relative w-32 h-32 mb-4">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl blur-lg opacity-20 dark:opacity-40 animate-pulse" />
              <div className="relative w-full h-full bg-white/50 dark:bg-slate-950/50 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm flex items-center justify-center shadow-xl">
                <Image
                  src="/logo.png"
                  alt="Alessence"
                  width={80}
                  height={80}
                  className="object-contain drop-shadow-md dark:drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight transition-colors duration-300">
                Welcome to Alessence
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-[240px] transition-colors duration-300">
                Your personal space for learning and growth.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Forms */}
        <div className="relative flex flex-col justify-center p-8 sm:p-12 h-full bg-white/50 dark:bg-slate-950/50 transition-colors duration-300 overflow-y-auto">
          {/* Mobile Background Blob (visible only on small) */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl md:hidden pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl md:hidden pointer-events-none" />

          <motion.div
            layout="position"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative z-10 w-full max-w-sm mx-auto"
          >
            <DialogHeader className="space-y-3 mb-8">
              <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-2 md:hidden">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-400 bg-clip-text text-transparent">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "signin" ? "Welcome Back" : "Create Account"}
                  </motion.span>
                </AnimatePresence>
              </DialogTitle>
              <DialogDescription className="text-center text-slate-500 dark:text-slate-400 text-base">
                <AnimatePresence mode="wait">
                  <motion.span
                    key={activeTab}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    {activeTab === "signin"
                      ? "Enter your details to access your account"
                      : "Begin your journey with us today"}
                  </motion.span>
                </AnimatePresence>
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-900/50 p-1 h-auto rounded-xl border border-slate-200 dark:border-slate-800/50 mb-8">
                <TabsTrigger
                  value="signin"
                  className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-slate-500 dark:text-slate-400 group"
                >
                  <LogIn className="h-4 w-4 group-data-[state=active]:text-indigo-500 dark:group-data-[state=active]:text-indigo-400" />
                  Sign In
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="flex items-center gap-2 py-2.5 rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-300 text-slate-500 dark:text-slate-400 group"
                >
                  <UserPlus className="h-4 w-4 group-data-[state=active]:text-purple-500 dark:group-data-[state=active]:text-purple-400" />
                  Sign Up
                </TabsTrigger>
              </TabsList>

              <div className="overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={activeTab}
                    initial={{
                      opacity: 0,
                      x: activeTab === "register" ? 20 : -20,
                    }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{
                      opacity: 0,
                      x: activeTab === "register" ? -20 : 20,
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <TabsContent
                      value="signin"
                      className="focus-visible:ring-0 focus-visible:outline-none mt-0"
                    >
                      <AuthLoginForm onSuccess={() => setOpen(false)} />
                    </TabsContent>
                    <TabsContent
                      value="register"
                      className="focus-visible:ring-0 focus-visible:outline-none mt-0"
                    >
                      <AuthRegisterForm
                        onSuccess={() => {
                          setActiveTab("signin");
                        }}
                      />
                    </TabsContent>
                  </motion.div>
                </AnimatePresence>
              </div>
            </Tabs>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SignInDialog;
