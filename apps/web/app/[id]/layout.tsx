import Navbar from "@/components/dashboard/Navbar";
import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 dark:from-slate-950 dark:via-slate-900 dark:to-purple-950 ">
      <Navbar />
      <main className="pt-16">{children}</main>
    </div>
  );
};

export default AuthenticatedLayout;
