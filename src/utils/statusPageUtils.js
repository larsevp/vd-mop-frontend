/**
 * StatusPage UI utilities and content generation
 */

/**
 * Generate content based on page type and error state
 */
export const getStatusPageContent = ({ type, title, description, loginError, error }) => {
  const hasError = loginError || error;

  switch (type) {
    case 'error':
    case 'sync-error':
      return {
        title: title || 'Synkroniseringsfeil',
        description: description || 'Det oppstod et problem under synkronisering av brukerdata',
        iconType: 'AlertTriangle',
        iconBg: 'bg-red-100'
      };
    
    case 'login':
    default:
      return {
        title: title || (hasError ? 'Innloggingsfeil' : 'Logg inn'),
        description: description || (hasError 
          ? 'Det oppstod et problem under innlogging' 
          : 'Bruk din Microsoft-konto for å fortsette'
        ),
        iconType: hasError ? 'AlertCircle' : 'LogIn',
        iconBg: hasError ? 'bg-red-100' : 'bg-blue-100'
      };
  }
};

/**
 * Check if signup button should be shown
 */
export const shouldShowSignupButton = (loginError, type) => {
  return ((loginError && /ekstern bruker|ikke tilgang|må legges til/i.test(loginError)) || type === 'login');
};

/**
 * Check if reload button should be shown in error message
 */
export const shouldShowReloadButton = (hasError) => {
  return hasError && (hasError.includes('pågår allerede') || hasError.includes('[Safari/iOS]'));
};
