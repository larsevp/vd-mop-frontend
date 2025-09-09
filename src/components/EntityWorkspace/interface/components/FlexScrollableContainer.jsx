import React, { useRef, useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * FlexScrollableContainer - Scrollable container designed for flex layouts
 * 
 * Based on the ScrollableContainer from components/ui/layout but optimized 
 * for flex containers that need to fill their parent height instead of 
 * having a fixed maxHeight constraint.
 * 
 * Features:
 * - Automatic overflow detection
 * - Scroll position tracking  
 * - Visual fade indicators when content overflows
 * - Responsive to window resize and content changes
 * - Works with flexbox layouts (flex-1, h-full, etc.)
 */
const FlexScrollableContainer = ({
  children,
  className = "",
  fadeColor = "from-white",
  dependencies = [],
  showScrollIndicator = true,
}) => {
  const scrollContainerRef = useRef(null);
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
    <div className={`relative min-h-0 ${className}`}>
      <div
        ref={scrollContainerRef}
        className="overflow-y-auto h-full pr-2"
        style={{ maxHeight: "100%" }}
      >
        {children}
      </div>

      {/* Conditional bottom fade gradient - hide when scrolled to bottom */}
      {showScrollIndicator && hasOverflow && !isScrolledToBottom && (
        <div className={`absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t ${fadeColor} to-transparent pointer-events-none z-10`} />
      )}
    </div>
  );
};

export default FlexScrollableContainer;