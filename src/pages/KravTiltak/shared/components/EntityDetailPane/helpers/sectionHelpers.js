export const initializeExpandedSections = (sections) => {
  const initialExpanded = new Set();
  Object.entries(sections).forEach(([sectionName, config]) => {
    if (config.defaultExpanded) {
      initialExpanded.add(sectionName);
    }
  });
  return initialExpanded;
};

export const toggleSection = (sectionName, setExpandedSections) => {
  setExpandedSections(prev => {
    const newSet = new Set(prev);
    if (newSet.has(sectionName)) {
      newSet.delete(sectionName);
    } else {
      newSet.add(sectionName);
    }
    return newSet;
  });
};

export const scrollToTop = (detailViewRef) => {
  if (detailViewRef.current) {
    setTimeout(() => {
      // Find the actual scroll container (FlexScrollableContainer creates it)
      let scrollContainer = detailViewRef.current;

      // Look for parent with overflow-y-auto (the FlexScrollableContainer's scroll div)
      while (scrollContainer && scrollContainer !== document.body) {
        const computedStyle = window.getComputedStyle(scrollContainer);
        if (computedStyle.overflowY === 'auto' || computedStyle.overflowY === 'scroll') {
          break;
        }
        scrollContainer = scrollContainer.parentElement;
      }

      // Fallback to the original element if no scroll container found
      if (!scrollContainer || scrollContainer === document.body) {
        scrollContainer = detailViewRef.current;
      }

      // Safety check: ensure scrollContainer is not null and has scrollTo method
      if (scrollContainer && typeof scrollContainer.scrollTo === 'function') {
        scrollContainer.scrollTo({
          top: 0,
          behavior: 'auto'
        });
      }
    }, 100);
  }
};