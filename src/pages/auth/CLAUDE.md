# Auth Pages

## ManualLoginPage.jsx
Admin login form (email + password). Stores tokens to localStorage (`mt`/`rt`). Sets `isManualLogin: true`.
Error handling: 401 → invalid credentials, 429 → rate limit.

## AuthRedirectPage.jsx
Handles Azure AD redirect callback. `handleRedirectPromise()` processing.
Error mapping: user_cancelled, access_denied → redirect to /login with error params.

## StatusPage.jsx
Unified login/error page. Types: `login`, `error`, `sync-error`.
Auto-redirects if already authenticated. MSAL login/signup/logout buttons.
