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
    detailViewRef.current.scrollTo({ top: 0, behavior: 'auto' });
  }
};