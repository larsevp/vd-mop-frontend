import React from "react";
import { Badge } from "@/components/ui/primitives/badge";

interface MultiSelectBadgesProps {
  items: Array<{ id: number; tittel: string; icon?: string; color?: string }>;
  maxDisplay?: number;
  variant?: "default" | "secondary" | "outline";
  size?: "sm" | "default";
  className?: string;
  emptyText?: string;
}

export function MultiSelectBadges({
  items,
  maxDisplay = 3,
  variant = "secondary",
  size = "sm",
  className = "",
  emptyText = "None selected",
}: MultiSelectBadgesProps) {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground text-sm">{emptyText}</span>;
  }

  const displayItems = items.slice(0, maxDisplay);
  const remainingCount = items.length - maxDisplay;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {displayItems.map((item) => (
        <Badge
          key={item.id}
          variant={variant}
          className={`text-xs ${size === "sm" ? "px-2 py-0.5" : ""}`}
          style={item.color ? { backgroundColor: item.color + "20", color: item.color } : undefined}
        >
          {item.icon && <span className="mr-1">{item.icon}</span>}
          {item.tittel}
        </Badge>
      ))}
      {remainingCount > 0 && (
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          +{remainingCount} fler
        </Badge>
      )}
    </div>
  );
}

export default MultiSelectBadges;
