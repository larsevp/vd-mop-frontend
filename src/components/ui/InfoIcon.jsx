import React from "react";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/primitives/dialog";

export function InfoIcon({ info, variant = "blue" }) {
  if (!info) return null;

  const colorClasses = variant === "gray"
    ? "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
    : "text-blue-400 hover:text-blue-600 hover:bg-blue-50";

  const handleClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div
      onClick={handleClick}
      onMouseDown={handleClick}
      className="inline-flex"
    >
      <Dialog>
        <DialogTrigger asChild>
          <button
            type="button"
            tabIndex={-1}
            className={`${colorClasses} transition-colors duration-200 p-0.5 rounded-full ml-1.5 relative z-10`}
            aria-label="Vis feltinformasjon"
          >
            <Info size={14} />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Beskrivelse</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-2">{info}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
