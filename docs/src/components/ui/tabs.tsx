"use client"

import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const [indicatorStyle, setIndicatorStyle] = React.useState<React.CSSProperties>({
    opacity: 0,
  })
  const [isInitialized, setIsInitialized] = React.useState(false)
  const listRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const updateIndicator = (animate = true) => {
      if (!listRef.current) return
      
      const activeTab = listRef.current.querySelector('[data-state="active"]') as HTMLElement
      if (activeTab) {
        const listRect = listRef.current.getBoundingClientRect()
        const tabRect = activeTab.getBoundingClientRect()
        
        setIndicatorStyle({
          width: `${tabRect.width}px`,
          height: `${tabRect.height}px`,
          left: `${tabRect.left - listRect.left}px`,
          top: `${tabRect.top - listRect.top}px`,
          opacity: 1,
          transition: animate && isInitialized ? 'all 300ms ease-in-out' : 'opacity 150ms ease-in-out',
        })
        
        if (!isInitialized) {
          setIsInitialized(true)
        }
      }
    }

    const timer1 = setTimeout(() => updateIndicator(false), 0)
    const timer2 = setTimeout(() => updateIndicator(false), 50)
    const timer3 = setTimeout(() => updateIndicator(false), 100)
    
    window.addEventListener('resize', () => updateIndicator(true))
    
    const observer = new MutationObserver(() => updateIndicator(true))
    if (listRef.current) {
      observer.observe(listRef.current, {
        attributes: true,
        subtree: true,
        attributeFilter: ['data-state']
      })
    }

    const rafId = requestAnimationFrame(() => {
      requestAnimationFrame(() => updateIndicator(false))
    })

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', () => updateIndicator(true))
      observer.disconnect()
    }
  }, [props.children, isInitialized])

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-fit w-fit items-center justify-center rounded-lg p-1 relative",
        className
      )}
      {...props}
    >
      <div
        className="absolute bg-white dark:bg-white/10 rounded-md shadow pointer-events-none left-0 top-0"
        style={indicatorStyle}
      />
      {props.children}
    </TabsPrimitive.List>
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex h-fit flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ease-in-out relative z-10",
        "text-muted-foreground/60",
        "data-[state=active]:text-foreground",
        "hover:text-foreground/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "[&_svg]:opacity-60 data-[state=active]:[&_svg]:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent }
