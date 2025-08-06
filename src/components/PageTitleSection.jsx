import React from 'react';
import { Plus, Copy } from 'lucide-react';



function PageTitleSection({
  title = 'Tittel',
  subtitle = '',
  onNew,
  newButtonLabel = 'Ny',
  newButtonIcon = <Plus size={18} />,
  showNewButton = true,
  onCopy,
  showCopy = false,
  rightChildren,
  children,
}) {
  return (
    <section className="border-b bg-white">
      <div className="max-w-screen-xl mx-auto px-4 py-10 sm:px-6 md:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-blue-700">{title}</h1>
            {subtitle && <p className="text-neutral-500 text-lg">{subtitle}</p>}
          </div>
          <div className="flex gap-3 items-center">
            {rightChildren}
            {showCopy && (
              <button
                className="inline-flex items-center gap-2 bg-white text-neutral-700 rounded-lg px-5 py-2.5 font-medium border border-neutral-300 hover:bg-neutral-50 hover:border-neutral-400 shadow-sm transition-all"
                onClick={onCopy}
              >
                <Copy size={18} />
                <span>Kopier fra generelt tiltak</span>
              </button>
            )}
            {showNewButton && (
              <button
                className="inline-flex items-center gap-2 bg-blue-500 text-white rounded-lg px-5 py-2.5 font-medium shadow-sm hover:bg-blue-600 hover:shadow transition-all"
                onClick={onNew}
              >
                {newButtonIcon}
                <span>{newButtonLabel}</span>
              </button>
            )}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export default PageTitleSection;
