"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, LogOut } from "lucide-react";

export default function UserDropdown({ email, onLogout }: { email: string; onLogout: () => void }) {
  const username = email.split("@")[0];
  const initial = username[0]?.toUpperCase() || "?";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <button className="flex items-center gap-1.5 bg-white/12 border border-white/25 rounded-full py-0.5 pr-2.5 pl-0.5 cursor-pointer text-white text-[0.8125rem] font-medium">
          <div className="size-6 rounded-full bg-white/25 flex items-center justify-center text-[0.7rem] font-bold">
            {initial}
          </div>
          {username}
          <ChevronDown className="size-3 transition-transform group-data-[popup-open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut className="size-3.5" /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
