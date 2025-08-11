import React from 'react';
import PageTitleSection from '../ui/PageTitleSection';

export default function AdminPage({
  title,
  description,
  listTitle,
  newButtonLabel,
  onNew,
  showNewButton = true,
  onBack,
  showBackButton = false,
  backButtonLabel,
  children
}) {
  return (
    <div className="bg-white min-h-screen">
      <PageTitleSection
        title={title}
        subtitle={description}
        onNew={onNew}
        newButtonLabel={newButtonLabel}
        showNewButton={showNewButton}
        showCopy={false}
        onBack={onBack}
        showBackButton={showBackButton}
        backButtonLabel={backButtonLabel}
      />
      <section className="max-w-screen-xl mx-auto px-4 py-12 sm:px-6 md:px-8">
        <div className="w-full">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-neutral-900">{listTitle}</h2>
          </div>
          {children}
        </div>
      </section>
    </div>
  );
}
