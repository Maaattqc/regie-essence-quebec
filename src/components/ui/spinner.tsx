import { cn } from "@/lib/utils"

function Spinner({ className }: { className?: string }) {
  return (
    <div className="flex justify-center py-8">
      <div
        className={cn(
          "size-6 animate-spin rounded-full border-[2.5px] border-muted border-t-muted-foreground",
          className
        )}
      />
    </div>
  )
}

export { Spinner }
