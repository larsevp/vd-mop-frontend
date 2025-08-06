import React from 'react';
import { useMsal } from '@azure/msal-react';

export default function ErrorPage({ error }) {
  const { instance } = useMsal();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-white">
      <div className="max-w-md w-full mx-4">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-900 mb-2">MOP</h1>
          <p className="text-neutral-600">Miljø og Prosjekthåndteringssystem</p>
        </div>

        {/* Error Card */}
        <div className="bg-white rounded-xl shadow-lg border border-neutral-200 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Synkroniseringsfeil</h2>
            <p className="text-neutral-600">Det oppstod et problem under synkronisering av brukerdata</p>
          </div>

          {/* Error Details */}
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Prøv igjen
            </button>
            <button 
              onClick={() => instance.logoutRedirect()}
              className="w-full bg-neutral-100 text-neutral-700 px-6 py-3 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
            >
              Logg ut og start på nytt
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-neutral-500 mb-2"> </p>
        </div>
      </div>
    </div>
  );
}
