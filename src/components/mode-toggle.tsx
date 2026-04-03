"use client"

import * as React from "react"
import { MoonIcon, SunIcon, Palette } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ModeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-xl hover:bg-accent/50 transition-all dark:hover:bg-white/10 dark:text-white zentry:text-white zentry:hover:bg-white/20">
          <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 zentry:-rotate-90 zentry:scale-0" />
          <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 zentry:-rotate-90 zentry:scale-0" />
          <Palette className="absolute h-5 w-5 rotate-90 scale-0 transition-all zentry:rotate-0 zentry:scale-100 text-white" />
          <span className="sr-only">Cambiar tema</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-2xl border-border/40 shadow-xl w-48">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1.5">
          Tema de Interfaz
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => setTheme("light")} 
          className={cn(
            "cursor-pointer rounded-xl flex items-center gap-2",
            theme === "light" && "bg-accent"
          )}
        >
          <SunIcon className="h-4 w-4 text-amber-500" />
          <span>Claro</span>
          {theme === "light" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("zentry")} 
          className={cn(
            "cursor-pointer rounded-xl flex items-center gap-2",
            theme === "zentry" && "bg-accent"
          )}
        >
          <Palette className="h-4 w-4 text-primary" />
          <span>Zentry</span>
          {theme === "zentry" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("dark")} 
          className={cn(
            "cursor-pointer rounded-xl flex items-center gap-2",
            theme === "dark" && "bg-accent"
          )}
        >
          <MoonIcon className="h-4 w-4 text-indigo-400" />
          <span>Oscuro</span>
          {theme === "dark" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => setTheme("system")} 
          className={cn(
            "cursor-pointer rounded-xl flex items-center gap-2 text-xs",
            theme === "system" && "bg-accent"
          )}
        >
          <span className="text-sm">💻</span>
          <span>Sistema</span>
          {theme === "system" && (
            <span className="ml-auto text-xs text-primary">✓</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 