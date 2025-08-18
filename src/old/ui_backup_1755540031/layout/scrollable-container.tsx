import React, { useRef, useEffect, useState, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

interface ScrollableContainerProps {
  children: ReactNode;
  maxHeight?: string; // Can be Tailwind class like "max-h-24" or CSS value like "6rem"
  fadeColor?: string;
  dependencies?: any[];
  className?: string;
}

export default function ScrollableContainer({
  children,
  maxHeight = "max-h-24",
  fadeColor = "from-primary-50",
  dependencies = [],
  className = "",
}: ScrollableContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollHeight, clientHeight } = scrollContainerRef.current;
        setHasOverflow(scrollHeight > clientHeight);
      }
    };

    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        // Check if scrolled to bottom (with 1px tolerance for precision)
        setIsScrolledToBottom(scrollTop + clientHeight >= scrollHeight - 1);
      }
    };

    checkOverflow();

    // Add scroll listener
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.addEventListener("scroll", handleScroll);
    }

    // Check again if window resizes
    window.addEventListener("resize", checkOverflow);

    return () => {
      window.removeEventListener("resize", checkOverflow);
      if (scrollContainer) {
        scrollContainer.removeEventListener("scroll", handleScroll);
      }
    };
  }, dependencies); // Re-check when dependencies change

  return (
    <div className={`relative ${className}`}>
      <div
        ref={scrollContainerRef}
        className={`overflow-y-auto pr-2 ${maxHeight.startsWith("max-h-") ? maxHeight : ""}`}
        style={maxHeight.startsWith("max-h-") ? {} : { maxHeight }}
      >
        {children}
      </div>

      {/* Conditional bottom fade gradient and scroll indicator - hide when scrolled to bottom */}
      {hasOverflow && !isScrolledToBottom && (
        <>
          <div className={`absolute bottom-0 left-0 right-0 h-3 bg-gradient-to-t ${fadeColor} to-transparent pointer-events-none`} />
          <div className="absolute bottom-0.5 right-1 text-primary-400">
            <ChevronDown size={12} className="animate-pulse" />
          </div>
        </>
      )}
    </div>
  );
}
