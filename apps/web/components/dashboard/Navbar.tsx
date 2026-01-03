"use client";

import React, { useState } from "react";
import UserButton from "./UserButton";
import { GlobalSearchBar } from "./GlobalSearchBar";
import { Home, Users, Share2, Bot, Menu, X, BookOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getFriendshipCounts } from "@/lib/actions/friendshipActions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ProfessionalProfileWidget } from "./ProfessionalProfileWidget";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const navLinks = [
  {
    href: (id: string) => `/${id}/dashboard`,
    label: "Dashboard",
    icon: Home,
    gradient: "from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20",
    hoverGradient: "hover:from-pink-100 hover:to-purple-100 dark:hover:from-pink-900/30 dark:hover:to-purple-900/30",
    iconColor: "text-pink-600 dark:text-pink-400",
    activeGradient: "from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40",
  },
  // {
  //   href: (id: string) => `/${id}/syllabus`,
  //   label: "Syllabus",
  //   icon: BookOpen,
  //   gradient: "from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20",
  //   hoverGradient: "hover:from-orange-100 hover:to-amber-100 dark:hover:from-orange-900/30 dark:hover:to-amber-900/30",
  //   iconColor: "text-orange-600 dark:text-orange-400",
  //   activeGradient: "from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40",
  // },
  {
    href: (id: string) => `/${id}/friends`,
    label: "Friends",
    icon: Users,
    gradient: "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
    hoverGradient: "hover:from-blue-100 hover:to-cyan-100 dark:hover:from-blue-900/30 dark:hover:to-cyan-900/30",
    iconColor: "text-blue-600 dark:text-blue-400",
    activeGradient: "from-blue-100 to-cyan-100 dark:from-blue-900/40 dark:to-cyan-900/40",
    hasBadge: true,
  },
  {
    href: (id: string) => `/${id}/shared`,
    label: "Shared",
    icon: Share2,
    gradient: "from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    hoverGradient: "hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30",
    iconColor: "text-green-600 dark:text-green-400",
    activeGradient: "from-green-100 to-emerald-100 dark:from-green-900/40 dark:to-emerald-900/40",
  },
  {
    href: (id: string) => `/${id}/assistant`,
    label: "AI Assistant",
    icon: Bot,
    gradient: "from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20",
    hoverGradient: "hover:from-violet-100 hover:to-purple-100 dark:hover:from-violet-900/30 dark:hover:to-purple-900/30",
    iconColor: "text-violet-600 dark:text-violet-400",
    activeGradient: "from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40",
  },
];

const Navbar = () => {
  const params = useParams();
  const pathname = usePathname();
  const dashboardId = params.id as string;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: counts } = useQuery({
    queryKey: ["friendshipCounts"],
    queryFn: async () => {
      const result = await getFriendshipCounts();
      if (!result.success) return { friends: 0, pendingReceived: 0, pendingSent: 0 };
      return result.data!;
    },
  });

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <motion.nav
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="
          fixed top-0 left-0 right-0 h-16 z-40
          bg-white/80 dark:bg-slate-900/80
          backdrop-blur-xl
          border-b border-gray-200/50 dark:border-gray-800/50
          shadow-sm
        "
      >
        <div className="h-full max-w-[1920px] mx-auto px-4 md:px-6 flex items-center justify-between gap-2 md:gap-4">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>

          {/* Desktop Nav Links */}
          <div className="hidden lg:flex items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const href = link.href(dashboardId);
              const active = isActive(href);
              
              return (
                <Link
                  key={link.label}
                  href={href}
                  className={cn(
                    "relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 group",
                    "bg-gradient-to-r",
                    active ? link.activeGradient : link.gradient,
                    link.hoverGradient
                  )}
                >
                  <Icon className={cn("w-4 h-4 group-hover:scale-110 transition-transform", link.iconColor)} />
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {link.label}
                  </span>
                  {link.hasBadge && counts && counts.pendingReceived > 0 && (
                    <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white animate-pulse">
                      {counts.pendingReceived}
                    </span>
                  )}
                  {active && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute inset-0 rounded-lg ring-2 ring-primary/30"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Center Section - Search (hidden on small screens) */}
          <div className="hidden md:flex flex-1 justify-center max-w-xl">
            <GlobalSearchBar />
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-2 md:gap-4">
            {/* Mobile Search Button */}
            <div className="md:hidden">
              <GlobalSearchBar />
            </div>
            {/* Gamification Stats */}
            <div className="hidden sm:block">
              <ProfessionalProfileWidget />
            </div>
            <ThemeSwitcher />
            <UserButton />
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-30 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-16 left-0 bottom-0 w-72 z-30 lg:hidden
                bg-white dark:bg-slate-900
                border-r border-gray-200 dark:border-gray-800
                shadow-xl
              "
            >
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">
                  Navigation
                </p>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const href = link.href(dashboardId);
                  const active = isActive(href);

                  return (
                    <Link
                      key={link.label}
                      href={href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200",
                        "bg-gradient-to-r",
                        active ? link.activeGradient : "hover:" + link.gradient.replace("from-", "from-").replace("to-", "to-"),
                        active && "ring-2 ring-primary/30"
                      )}
                    >
                      <Icon className={cn("w-5 h-5", link.iconColor)} />
                      <span className="font-medium text-gray-800 dark:text-gray-100">
                        {link.label}
                      </span>
                      {link.hasBadge && counts && counts.pendingReceived > 0 && (
                        <span className="ml-auto flex size-6 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                          {counts.pendingReceived}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>

              {/* Mobile Menu Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-800">
                <p className="text-xs text-muted-foreground text-center">
                  Alessence Study Platform
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
