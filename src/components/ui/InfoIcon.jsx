import React from "react";
import { Info } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/primitives/dialog";

export function InfoIcon({ info }) {
  if (!info) return null;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="text-blue-400 hover:text-blue-600 transition-colors duration-200 p-0.5 rounded-full hover:bg-blue-50 ml-1.5"
          aria-label="Vis feltinformasjon"
        >
          <Info size={14} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Feltinformasjon</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed pt-2">{info}</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
