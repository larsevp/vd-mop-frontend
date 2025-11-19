import React, { useRef, useEffect, forwardRef } from "react";

/**
 * ScrollPreventWrapper - Prevents scroll events on wrapped content
 *
 * Usage:
 * <ScrollPreventWrapper>
 *   <YourComponent />
 * </ScrollPreventWrapper>
 */
const ScrollPreventWrapper = forwardRef(({ children, className, style, ...props }, ref) => {
  const wrapperRef = useRef(null);

  // Prevent scrolling on this element
  useEffect(() => {
    const element = wrapperRef.current;
    if (!element) return;

    const preventScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // Add wheel listener with passive: false to allow preventDefault
    element.addEventListener('wheel', preventScroll, { passive: false });

    return () => {
      element.removeEventListener('wheel', preventScroll);
    };
  }, []);

  // Merge internal ref with forwarded ref
  const mergeRefs = (node) => {
    wrapperRef.current = node;
    if (ref) {
      if (typeof ref === 'function') {
        ref(node);
      } else {
        ref.current = node;
      }
    }
  };

  return (
    <div
      ref={mergeRefs}
      className={className}
      style={{ ...style, overscrollBehavior: 'none' }}
      {...props}
    >
      {children}
    </div>
  );
});

ScrollPreventWrapper.displayName = 'ScrollPreventWrapper';

export default ScrollPreventWrapper;
