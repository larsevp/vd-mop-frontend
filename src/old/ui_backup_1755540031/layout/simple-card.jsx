import React from 'react';
import { getThemeClasses } from "@/hooks/useTheme";

export default function ({
  title = "Simple Card", 
  subtitle = "Subtitle", 
  content = null, // Allow JSX elements
  height = "auto",
  buttonText = "Action",
  onButtonClick,
  showButton = true
}) {
  const heightClass = height === "1/2" ? "h-1/2" : height === "full" ? "h-full" : "";

  return (
    <div className={`bg-background-primary rounded-xl border border-border-muted p-6 shadow-sm flex flex-col items-center justify-center text-center ${heightClass}`}>
      <h2 className="text-lg font-semibold text-text-primary mb-2">{title}</h2>
      <p className="text-text-muted mb-6">{subtitle}</p>
      {content}
    </div>
  );
}