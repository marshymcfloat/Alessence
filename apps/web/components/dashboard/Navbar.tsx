import React from "react";
import UserButton from "./UserButton";

const Navbar = () => {
  return (
    <div className="bg-gray-500/20 absolute gap-4 bg-clip-padding backdrop-filter lg:top-4 bottom-4 flex items-center justify-center  -translate-x-1/2 right-1/2 left-1/2 backdrop-blur-[2px] bg-opacity-10 backdrop-saturate-100 backdrop-contrast-100 w-[300px] lg:w-[400px] h-11 lg:h-[60px] rounded-full">
      <span className="font-medium">Home</span>
      <UserButton />
    </div>
  );
};

export default Navbar;
