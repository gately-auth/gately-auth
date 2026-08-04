import * as React from "react"
import * as ReactDOM from "react-dom"
import { cn } from "@/lib/utils"

interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
}

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "left" | "right" | "top" | "bottom"
  children: React.ReactNode
}

export function Sheet({ open, onOpenChange, children }: SheetProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  if (!mounted || !open) return null

  return ReactDOM.createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
        style={{ zIndex: 9998 }}
        onClick={() => onOpenChange(false)}
      />
      {children}
    </>,
    document.body
  )
}

export function SheetContent({
  side = "right",
  className,
  children,
  ...props
}: SheetContentProps) {
  const sideClasses = {
    right: "right-0 top-0 h-full w-full sm:max-w-[400px] border-l",
    left:  "left-0 top-0 h-full w-full sm:max-w-[320px] border-r",
    top:   "top-0 left-0 w-full sm:max-h-[400px] border-b",
    bottom:"bottom-0 left-0 w-full sm:max-h-[400px] border-t",
  }

  return (
    <div
      className={cn(
        "fixed flex flex-col bg-background shadow-2xl",
        sideClasses[side],
        className
      )}
      style={{ zIndex: 9999 }}
      {...props}
    >
      {children}
    </div>
  )
}
