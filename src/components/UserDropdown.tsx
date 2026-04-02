"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Info } from "lucide-react";

export default function UserDropdown({ email, onLogout }: { email: string; onLogout: () => void }) {
  const router = useRouter();
  const username = email.split("@")[0];
  const initial = username[0]?.toUpperCase() || "?";
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        <span className="flex items-center gap-1.5 bg-white/12 border border-white/25 rounded-full py-0.5 pr-2.5 pl-0.5 cursor-pointer text-white text-[0.8125rem] font-medium">
          <span className="size-6 rounded-full bg-white/25 flex items-center justify-center text-[0.7rem] font-bold">
            {initial}
          </span>
          {username}
          <ChevronDown className="size-3 transition-transform group-data-[popup-open]:rotate-180" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[16rem]">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{email}</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/tech")}>
          <Info className="size-3.5" /> Infos techniques
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onLogout}>
          <LogOut className="size-3.5" /> Déconnexion
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
