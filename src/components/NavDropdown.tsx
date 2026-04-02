"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Settings, Shield, FileText, Info } from "lucide-react";

export default function NavDropdown({ onChangelogClick }: { onChangelogClick: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="flex items-center justify-center size-8 rounded-lg text-white/85 hover:text-white hover:bg-white/15 transition-colors cursor-pointer">
          <Settings className="size-4" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[11rem]">
        <DropdownMenuItem>
          <a href="/admin" className="flex items-center gap-2 w-full no-underline text-inherit">
            <Shield className="size-3.5" /> Gestion Admin
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChangelogClick}>
          <FileText className="size-3.5" /> Changelogs Code
        </DropdownMenuItem>
        <DropdownMenuItem>
          <a href="/tech" className="flex items-center gap-2 w-full no-underline text-inherit">
            <Info className="size-3.5" /> À propos
          </a>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
