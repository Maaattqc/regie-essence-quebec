"use client";

import { useTheme } from "next-themes";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Settings, Shield, FileText, Info, Lock, Lightbulb, Sun, Moon, BookOpen, Cpu } from "lucide-react";

export default function NavDropdown({ onChangelogClick, onSuggestionClick }: { onChangelogClick: () => void; onSuggestionClick?: () => void }) {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="flex items-center justify-center size-8 rounded-lg text-white/85 hover:text-white hover:bg-white/15 transition-colors cursor-pointer">
          <Settings className="size-4" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="!w-auto min-w-[12rem]">
        {onSuggestionClick && (
          <DropdownMenuItem className="nav-suggestion-mobile" onClick={onSuggestionClick}>
            <Lightbulb className="size-3.5" /> Suggestion
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className="nav-theme-mobile" onClick={() => setTheme(isDark ? "light" : "dark")}>
          {isDark ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
          {isDark ? "Mode clair" : "Mode sombre"}
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/admin" className="flex items-center gap-2 w-full no-underline text-inherit">
            <Shield className="size-3.5" /> Gestion Admin
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChangelogClick}>
          <FileText className="size-3.5" /> Changelogs Code
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/a-propos" className="flex items-center gap-2 w-full no-underline text-inherit">
            <BookOpen className="size-3.5" /> Résumé
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/tech" className="flex items-center gap-2 w-full no-underline text-inherit">
            <Cpu className="size-3.5" /> Fiche technique
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/confidentialite" className="flex items-center gap-2 w-full no-underline text-inherit">
            <Lock className="size-3.5" /> Confidentialité
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
