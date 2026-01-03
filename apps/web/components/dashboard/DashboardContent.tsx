"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  BookOpen,
  Calendar,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  MoreVertical,
  Settings,
  User,
  Timer,
  FileText,
  BarChart,
  PenTool,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, Suspense, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SubjectWithTaskProgress } from "@repo/types";
import { Task } from "@repo/db";
import { PerformanceDashboard } from "./PerformanceDashboard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

import { TimerTab } from "./tabs/TimerTab";
import { TasksTab } from "./tabs/TasksTab";
import { StudyTab } from "./tabs/StudyTab";
import { ScheduleTab } from "./tabs/ScheduleTab";
import { ToolsTab } from "./tabs/ToolsTab";

import { useQueryState } from "nuqs";
import { NotesTab } from "./tabs/NotesTab";
import { SubjectsOverview } from "./SubjectsOverview";

const DashboardContent = ({
  initialTasks,
  userId,
  subjects,
  initialSchedule,
}: {
  initialTasks: Task[];
  userId: string;
  subjects?: SubjectWithTaskProgress[];
  initialSchedule?: any[];
}) => {
  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "timer",
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries();
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const navItems = [
    { value: "timer", label: "Focus Timer", icon: Timer },
    { value: "tasks", label: "Tasks", icon: CheckSquare },
    { value: "subjects", label: "Subjects", icon: BookOpen },
    { value: "notes", label: "Notes", icon: FileText },
    { value: "study", label: "Study", icon: BookOpen },
    { value: "schedule", label: "Schedule", icon: Calendar },
    { value: "analytics", label: "Analytics", icon: BarChart },
    { value: "tools", label: "Tools", icon: PenTool },
  ];

  // Scroll to active tab on mobile
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      const activeElement = scrollContainerRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      }
    }
  }, [activeTab]);

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white dark:bg-slate-900 z-20">
        <div className="p-6 flex items-center gap-2 border-b">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-white" />
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">
            Alessence
          </span>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.value}
              onClick={() => setActiveTab(item.value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.value
                  ? "bg-gradient-to-r from-pink-500/10 to-purple-500/10 text-pink-600 dark:text-pink-400"
                  : "text-gray-600 dark:text-gray-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon
                className={`w-5 h-5 ${
                  activeTab === item.value
                    ? "text-pink-600 dark:text-pink-400"
                    : "text-gray-500"
                }`}
              />
              {item.label}
            </button>
          ))}
        </div>

        <div className="p-4 border-t space-y-2">
          <Button variant="ghost" className="w-full justify-start gap-3" size="sm">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <div className="flex items-center gap-3 px-2 py-2">
             <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-600 text-white text-xs">U</AvatarFallback>
             </Avatar>
             <div className="flex-1 min-w-0">
               <p className="text-sm font-medium truncate">User</p>
               <p className="text-xs text-muted-foreground truncate">student@alessence.com</p>
             </div>
             <Button variant="ghost" size="icon" className="h-8 w-8">
               <LogOut className="w-4 h-4 ml-1" />
             </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Mobile Navigation - Horizontal Scroll */}
        <div className="md:hidden border-b bg-white dark:bg-slate-900 z-20 shrink-0">
          <div 
            ref={scrollContainerRef}
            className="flex items-center gap-2 overflow-x-auto py-3 px-4 no-scrollbar scroll-smooth"
          >
            {navItems.map((item) => {
              const isActive = activeTab === item.value;
              return (
                <button
                  key={item.value}
                  onClick={() => setActiveTab(item.value)}
                  data-active={isActive}
                  className={`relative flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors duration-200 ${
                    isActive
                      ? "text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-gray-200"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeTab-mobile"
                      className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full"
                      initial={false}
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <div className="relative z-10 flex items-center gap-2">
                    <item.icon
                      className={`w-4 h-4 ${
                         isActive ? "text-white" : "text-gray-500 dark:text-gray-400"
                      }`}
                    />
                    {item.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
           <div className="absolute -top-[20%] -right-[10%] w-[70%] h-[70%] bg-purple-200/20 dark:bg-purple-900/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob" />
           <div className="absolute top-[20%] -left-[10%] w-[50%] h-[50%] bg-pink-200/20 dark:bg-pink-900/10 blur-[100px] rounded-full mix-blend-multiply dark:mix-blend-screen animate-blob animation-delay-2000" />
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 z-10 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-end mb-4">
              <Button
                 variant="ghost"
                 size="sm"
                 onClick={handleRefresh}
                 disabled={isRefreshing}
                 className={isRefreshing ? "opacity-50" : ""}
               >
                 {isRefreshing ? "Refreshing..." : "Refresh Data"}
               </Button>
            </div>

            <Tabs value={activeTab || "timer"} className="space-y-0 text-foreground">
               <ErrorBoundary name="Focus Timer">
                 <TabsContent value="timer" className="mt-0">
                   <TimerTab />
                 </TabsContent>
               </ErrorBoundary>

               <ErrorBoundary name="Tasks">
                 <TabsContent value="tasks" className="mt-0">
                   <TasksTab initialTasks={initialTasks} />
                 </TabsContent>
               </ErrorBoundary>

               <ErrorBoundary name="Subjects">
                 <TabsContent value="subjects" className="mt-0">
                   <SubjectsOverview initialSubjects={subjects || []} />
                 </TabsContent>
               </ErrorBoundary>

               <ErrorBoundary name="Notes">
                 <TabsContent value="notes" className="mt-0">
                   <NotesTab />
                 </TabsContent>
               </ErrorBoundary>

               <ErrorBoundary name="Study Materials">
                 <TabsContent value="study" className="mt-0">
                   <StudyTab />
                 </TabsContent>
               </ErrorBoundary>

               <ErrorBoundary name="Schedule">
                 <TabsContent value="schedule" className="mt-0">
                   <ScheduleTab initialSchedule={initialSchedule || []} />
                 </TabsContent>
               </ErrorBoundary>

               <ErrorBoundary name="Analytics">
                 <TabsContent value="analytics" className="mt-0">
                   <PerformanceDashboard />
                 </TabsContent>
               </ErrorBoundary>

               <ErrorBoundary name="Tools">
                 <TabsContent value="tools" className="mt-0">
                   <ToolsTab />
                 </TabsContent>
               </ErrorBoundary>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default function DashboardContentWrapper(props: any) {
  return (
    <Suspense fallback={
       <div className="flex h-screen items-center justify-center">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
       </div>
    }>
      <DashboardContent {...props} />
    </Suspense>
  );
}
