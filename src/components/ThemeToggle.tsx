"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
    const [mounted, setMounted] = React.useState(false);
    const { theme, setTheme, resolvedTheme } = useTheme();

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return <div className="w-10 h-10" />;

    const currentTheme = theme === "system" ? resolvedTheme : theme;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(currentTheme === "light" ? "dark" : "light")}
            className="rounded-full w-10 h-10 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
            title="Toggle theme"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-neutral-800 dark:text-neutral-200" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-neutral-800 dark:text-neutral-200" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    );
}
