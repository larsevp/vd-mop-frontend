import React, { useState } from 'react';
import { Search, Filter, ChevronDown } from 'lucide-react';

function FilterSection({ temaList = [], selectedTema, onTemaChange, onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');
  
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };
  
  return (
    <section className="sticky top-0 z-10 backdrop-blur-sm bg-white/80 border-b border-neutral-200 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 py-4 sm:px-6 md:px-8">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-neutral-400">
              <Search size={18} />
            </div>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              placeholder="Søk etter tiltak..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-1.5 text-neutral-500 font-medium text-sm">
              <Filter size={16} />
              <span>Filter:</span>
            </div>
            <div className="relative flex-1 sm:flex-initial">
              <select
                className="appearance-none w-full bg-white border border-neutral-200 rounded-lg px-4 py-2.5 pr-8 text-sm text-neutral-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                value={selectedTema || ''}
                onChange={e => onTemaChange?.(e.target.value)}
              >
                <option value="">Alle tema</option>
                {temaList.map((tema) => (
                  <option key={tema.id} value={tema.id}>{tema.navn}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-neutral-400">
                <ChevronDown size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FilterSection;
