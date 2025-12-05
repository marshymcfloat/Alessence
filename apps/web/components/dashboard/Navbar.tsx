"use client";

import React from "react";
import UserButton from "./UserButton";
import { Home } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

const Navbar = () => {
  return (
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
      <div className="h-full max-w-[1920px] mx-auto px-6 flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-6">
          <Link
            href="#"
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-gradient-to-r from-pink-50 to-purple-50
              dark:from-pink-900/20 dark:to-purple-900/20
              hover:from-pink-100 hover:to-purple-100
              dark:hover:from-pink-900/30 dark:hover:to-purple-900/30
              transition-all duration-200
              group
            "
          >
            <Home className="w-4 h-4 text-pink-600 dark:text-pink-400 group-hover:scale-110 transition-transform" />
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
              Dashboard
            </span>
          </Link>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          <UserButton />
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;
