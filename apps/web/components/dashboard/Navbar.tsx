import React from "react";
import UserButton from "./UserButton";
import { Home, PlusCircle } from "lucide-react";

const Navbar = () => {
  return (
    <nav
      className="
        fixed left-1/2 top-4 z-50 -translate-x-1/2 
        flex items-center gap-2 rounded-full border border-white/20 
        bg-white/10 p-2 shadow-lg
        backdrop-blur-md
      "
    >
      <a
        href="#"
        className="
          flex items-center gap-x-2 rounded-full bg-white/50 px-4 
          py-2 text-sm font-semibold text-gray-800 transition-colors
          hover:bg-white/70
        "
      >
        <Home className="size-4" />
        <span>Home</span>
      </a>

      <div className="mx-2 h-6 w-px bg-white/30"></div>

      <UserButton />
    </nav>
  );
};

export default Navbar;
