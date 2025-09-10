import React from "react";

const ValidationErrorSummary = ({ errors, fields }) => {
  const errorEntries = Object.entries(errors || {}).filter(([_, error]) => error);

  if (errorEntries.length === 0) return null;

  return (
    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center mb-2">
        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <h3 className="text-red-800 font-medium">Validering feilet</h3>
      </div>
      <p className="text-red-700 text-sm mb-3">Følgende felt må fylles ut før du kan lagre:</p>
      <ul className="text-red-700 text-sm space-y-1">
        {errorEntries.map(([fieldName, error]) => {
          const field = fields.find(f => f.name === fieldName);
          const fieldLabel = field ? field.label : fieldName;
          return (
            <li key={fieldName} className="flex items-start">
              <span className="inline-block w-1 h-1 bg-red-600 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              <span>{fieldLabel}: {error}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ValidationErrorSummary;