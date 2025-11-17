import Navbar from "@/components/dashboard/Navbar";
import React from "react";

const AuthenticatedLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className="min-h-screen bg-linear-to-b from-pink-50 via-pink-100 to-white dark:from-pink-950 dark:via-purple-950 dark:to-slate-900 p-8">
      <Navbar />
      {children}
    </main>
  );
};

export default AuthenticatedLayout;
