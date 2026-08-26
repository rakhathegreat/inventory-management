import * as React from "react"
import { cn } from "@/shared/lib/utils"

interface ScrollShadowWrapperProps {
  children: React.ReactNode
  className?: string
}

export function ScrollShadowWrapper({
  children,
  className,
}: ScrollShadowWrapperProps) {
  const [canScrollTop, setCanScrollTop] = React.useState(false)
  const [canScrollBottom, setCanScrollBottom] = React.useState(false)
  const [headerHeight, setHeaderHeight] = React.useState(40)
  const scrollRef = React.useRef<HTMLDivElement>(null)

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current
      setCanScrollTop(scrollTop > 0)
      setCanScrollBottom(Math.ceil(scrollTop + clientHeight) < scrollHeight)

      const thead = scrollRef.current.querySelector("thead")
      if (thead) {
        setHeaderHeight(thead.offsetHeight)
      }
    }
  }

  React.useEffect(() => {
    checkScroll()
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => checkScroll())
    observer.observe(el)
    if (el.firstElementChild) observer.observe(el.firstElementChild)
    const thead = el.querySelector("thead")
    if (thead) observer.observe(thead)
    return () => observer.disconnect()
  }, [children])

  return (
    <div className={cn("rounded-lg border overflow-hidden relative flex-1 min-h-0", className)}>
      <div
        ref={scrollRef}
        className="overflow-auto h-full max-h-[65vh] lg:max-h-none overscroll-contain [&>div]:overflow-visible [&>div]:static"
        onScroll={checkScroll}
      >
        {children}
      </div>
      {canScrollTop && (
        <div
          className="absolute left-0 right-0 h-6 bg-linear-to-b from-card to-transparent pointer-events-none z-30"
          style={{ top: `${headerHeight}px` }}
        />
      )}
      {canScrollBottom && (
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-card to-transparent pointer-events-none rounded-b-lg z-30" />
      )}
    </div>
  )
}