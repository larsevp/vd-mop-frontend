import React, { useState } from 'react';
import TiltakCard from './TiltakCard';
import { ChevronDown, ChevronUp, Tag } from 'lucide-react';

function TemaSection({ tema, tiltakList = [], type, ...cardProps }) {
  const [open, setOpen] = useState(true);
  
  return (
    <section className="mb-10">
      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
        <div 
          className="flex items-center gap-3 px-8 py-4 cursor-pointer hover:bg-neutral-50 transition-colors"
          onClick={() => setOpen(o => !o)}
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <Tag size={18} />
            </div>
            <h2 className="font-semibold text-xl text-neutral-900">{tema.navn}</h2>
            <div className="text-neutral-400 text-sm font-medium">
              {tiltakList.length} {tiltakList.length === 1 ? 'tiltak' : 'tiltak'}
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-neutral-100 text-neutral-500"
            aria-label={open ? 'Skjul' : 'Vis'}
          >
            {open ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
        
        {open && (
          <div className="border-t border-neutral-200 p-6 space-y-4">
            {tiltakList.map((tiltak) => (
              <TiltakCard key={tiltak.id} tiltak={tiltak} type={type} {...cardProps} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TemaSection;
