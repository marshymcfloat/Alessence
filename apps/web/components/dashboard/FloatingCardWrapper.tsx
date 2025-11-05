"use client";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "../ui/button";

const FloatingCardWrapper = ({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card
      className={cn(
        "absolute top-4 z-10 left-4 transition-all duration-300 ease-in-out",

        isExpanded
          ? "w-[400px] bg-white/80 backdrop-blur-sm"
          : "w-auto bg-transparent border-none shadow-none",
        className
      )}
    >
      <div className="relative">
        <Button
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn(
            "z-20 transition-all duration-300",

            !isExpanded && "size-10 rounded-full bg-white shadow-lg",

            isExpanded && "absolute top-2 right-1 size-6"
          )}
          variant={"ghost"}
          size="icon"
        >
          <ChevronRight
            size={16}
            className={cn("transition-transform", isExpanded && "rotate-90")}
          />
        </Button>

        {isExpanded && (
          <div className="animate-in fade-in-0 duration-300">
            <CardHeader>
              <CardTitle className="pr-8">{title}</CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
          </div>
        )}
      </div>
    </Card>
  );
};

export default FloatingCardWrapper;
