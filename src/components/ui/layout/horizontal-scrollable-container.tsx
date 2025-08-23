import React, { useRef, useEffect, useState, ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalScrollableContainerProps {
  children: ReactNode;
  maxWidth?: string; // Can be Tailwind class like "max-w-full" or CSS value like "100%"
  fadeColor?: string;
  dependencies?: any[];
  className?: string;
}

export default function HorizontalScrollableContainer({
  children,
  maxWidth = "max-w-full",
  fadeColor = "from-white",
  dependencies = [],
  className = "",
}: HorizontalScrollableContainerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScrolledToStart, setIsScrolledToStart] = useState(true);
  const [isScrolledToEnd, setIsScrolledToEnd] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (scrollContainerRef.current) {
        const { scrollWidth, clientWidth } = scrollContainerRef.current;
        setHasOverflow(scrollWidth > clientWidth);
      }
    };

    const handleScroll = () => {
      if (scrollContainerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
        // Check if scrolled to start (with 1px tolerance for precision)
        setIsScrolledToStart(scrollLeft <= 1);
        // Check if scrolled to end (with 1px tolerance for precision)
        setIsScrolledToEnd(scrollLeft + clientWidth >= scrollWidth - 1);
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
        className={`overflow-x-auto pb-2 ${maxWidth.startsWith("max-w-") ? maxWidth : ""}`}
        style={maxWidth.startsWith("max-w-") ? {} : { maxWidth }}
      >
        {children}
      </div>

      {/* Left fade gradient and scroll indicator - hide when scrolled to start */}
      {hasOverflow && !isScrolledToStart && (
        <>
          <div className={`absolute top-0 bottom-0 left-0 w-6 bg-gradient-to-r ${fadeColor} to-transparent pointer-events-none`} />
          <div className="absolute top-1/2 left-1 transform -translate-y-1/2 text-primary-400">
            <ChevronLeft size={16} />
          </div>
        </>
      )}

      {/* Right fade gradient and scroll indicator - hide when scrolled to end */}
      {hasOverflow && !isScrolledToEnd && (
        <>
          <div className={`absolute top-0 bottom-0 right-0 w-6 bg-gradient-to-l ${fadeColor} to-transparent pointer-events-none`} />
          <div className="absolute top-1/2 right-1 transform -translate-y-1/2 text-primary-400">
            <ChevronRight size={16} />
          </div>
        </>
      )}
    </div>
  );
}
