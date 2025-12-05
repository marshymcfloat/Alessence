"use client";

import { useSidebar } from "./SidebarContext";

const DashboardMainContent = ({ children }: { children: React.ReactNode }) => {
  const { isExpanded } = useSidebar();

  return (
    <div
      className="flex-1 transition-all duration-300 overflow-hidden"
      style={{ marginLeft: isExpanded ? "320px" : "80px" }}
    >
      {children}
    </div>
  );
};

export default DashboardMainContent;

