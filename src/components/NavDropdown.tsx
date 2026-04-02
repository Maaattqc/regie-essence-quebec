"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Shield, FileText } from "lucide-react";

export default function NavDropdown({ onChangelogClick }: { onChangelogClick: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button className="flex items-center gap-1 text-white/85 hover:text-white text-[13px] font-medium cursor-pointer bg-transparent border-none">
          Menu <ChevronDown className="size-3 transition-transform group-data-[popup-open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <a href="/admin" className="flex items-center gap-2 w-full no-underline text-inherit">
            <Shield className="size-3.5" /> Admin
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onChangelogClick}>
          <FileText className="size-3.5" /> Changelog
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
