"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  const isDark = theme === "dark";

  return (
    <div className="fixed  top-20 right-4!  w-fit h-fit  z-50 flex items-center gap-2 rounded-lg border bg-background/80 backdrop-blur-sm p-2 shadow-lg">
      <Sun className="h-4 w-4 text-foreground/70" />
      <Switch
        checked={isDark}
        onCheckedChange={(checked) => {
          setTheme(checked ? "dark" : "light");
        }}
        aria-label="Toggle theme"
      />
      <Moon className="h-4 w-4 text-foreground/70" />
    </div>
  );
}
