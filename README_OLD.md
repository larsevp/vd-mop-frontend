# MOP Frontend

Miljø og Prosjekthåndteringssystem (MOP) - Frontend Application

## Overview

A modern React-based frontend application for the MOP (Environment and Project Management System) that provides a comprehensive interface for managing projects, tasks, and user administration with Microsoft Azure AD authentication.

## Features

### 🔐 Authentication & Authorization
- **Microsoft Azure AD Integration**: Seamless Single Sign-On (SSO) with Microsoft accounts
- **Automatic User Provisioning**: First-time users are automatically created in the backend database
- **Traditional SSO Flow**: Direct redirect to Microsoft authentication without intermediate login pages
- **Error Handling**: Comprehensive error feedback for authentication issues
- **Token Management**: Secure JWT token handling with automatic refresh

### 📊 Project Management
- **Project Overview**: Landing page with project statistics and quick access
- **Project Administration**: Full CRUD operations for projects
- **Task Management**: Comprehensive task tracking and management
- **Progress Tracking**: Visual progress indicators and completion status

### 👥 User Administration
- **User Management**: Admin interface for managing system users
- **Role-based Access**: Different access levels based on user roles
- **Unit Management**: Organization unit assignment and management

### 🎨 User Interface
- **Modern Design**: Clean, responsive design with Tailwind CSS
- **Mobile-First**: Optimized for all screen sizes
- **Accessibility**: WCAG compliant with proper ARIA labels
- **Loading States**: Visual feedback during data operations
- **Error Boundaries**: Graceful error handling throughout the app

## Technology Stack

### Core Framework
- **React 18**: Modern React with hooks and concurrent features
- **Vite**: Fast build tool and development server
- **React Router**: Client-side routing with protected routes

### Authentication
- **@azure/msal-react**: Microsoft Authentication Library for React
- **@azure/msal-browser**: Browser-specific MSAL functionality

### State Management & Data Fetching
- **@tanstack/react-query**: Server state management with caching
- **Zustand**: Lightweight global state management

### UI & Styling
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Modern icon library
- **Responsive Design**: Mobile-first approach

### HTTP Client
- **Axios**: Promise-based HTTP client with interceptors

## Project Structure OLD


```
src/
├── hooks/                 # Custom React hooks
│   └── useAuth.js         # Authentication state management
├── components/            # Reusable UI components
│   ├── LoadingSpinner.jsx # Loading state component
│   ├── MainLayout.jsx     # Main app layout wrapper
│   ├── RowNew.jsx         # Generic form for creating records
│   └── RowEdit.jsx        # Generic form for editing records
├── pages/                 # Page components
│   ├── ErrorPage.jsx      # Full-screen error display
│   ├── LandingPage.jsx    # Main dashboard/landing page
│   ├── LoginPage.jsx      # Error handling and manual login
│   ├── Brukeradministrasjon.jsx      # User administration
│   ├── Prosjektadministrasjon.jsx    # Project administration
│   ├── TiltaksoversiktGenerelle.jsx  # General tasks overview
│   └── TiltaksoversiktProsjekt.jsx   # Project-specific tasks
├── api/                   # API layer
│   ├── index.js           # Main API client with interceptors
│   ├── userApi.js         # User-related API calls
│   └── prosjektApi.js     # Project-related API calls
├── stores/                # State management
│   ├── store.js           # Main store configuration
│   └── userStore.js       # User-specific state
├── config/                # Configuration files
│   └── modelConfigs.js    # Model configuration for forms
├── App.jsx                # Main application controller
├── AppRouter.jsx          # Route definitions
├── HeaderNav.jsx          # Navigation component
├── main.jsx               # Application entry point
├── msalConfig.js          # Microsoft authentication configuration
└── queryClient.js         # React Query configuration
```

## Authentication Flow

### Traditional Microsoft SSO Pattern

1. **Initial Access**: User visits any protected route
2. **Direct Redirect**: Automatically redirected to Microsoft Azure AD
3. **Authentication**: User authenticates with Microsoft credentials
4. **Token Return**: Microsoft redirects back with authentication tokens
5. **User Sync**: `useAuth` hook checks/creates user in backend automatically
6. **App Access**: User gains access to the intended page

### Automatic User Creation

When a user authenticates for the first time:
- System extracts user info from Microsoft token (`oid`, `sub`, `preferred_username`)
- `useAuth` hook optimistically sets user info from MSAL token
- First API call to backend triggers automatic user creation if needed:
  - `authJwt.ts` validates Microsoft token
  - `processJwtPayload.ts` extracts user info and creates user with default settings
  - Role: 'user'
  - Unit: Default unit (enhetId: 1)
- If user creation fails or user doesn't exist, 401 error triggers error page

### Error Handling

- **ErrorPage Component**: Serves as full-screen error display for authentication failures
- **Detailed Feedback**: Shows specific error messages from authentication or sync processes
- **Recovery Options**: Retry sync or logout and restart authentication
- **No Navigation**: Error pages display without header navigation for clean error isolation

## Error Handling Architecture

### Centralized Authentication Management

The application uses a clean, centralized approach for handling authentication and error states with a "fail fast" pattern:

#### useAuth Custom Hook

```javascript
// hooks/useAuth.js
export const useAuth = () => {
  const { accounts, instance } = useMsal();
  const setUser = useUserStore(state => state.setUser);
  const [syncStatus, setSyncStatus] = useState('success'); // Start optimistic
  const [syncError, setSyncError] = useState(null);

  // Sets up global error handler for React Query
  // Optimistically extracts user info from MSAL token
  // Backend validates user existence on first API call
  // Returns: { syncStatus, syncError, instance, authErrorCount }
};
```

#### App.jsx - Central Controller

The main `App.jsx` component acts as the central controller:

```javascript
function AuthenticatedApp() {
  const { syncStatus, syncError, authErrorCount } = useAuth();

  if (syncStatus === 'syncing') return <LoadingSpinner />;
  if (syncStatus === 'error') return <ErrorPage error={syncError} />;
  return <AppRouter />;
}
```

#### Component Architecture

1. **`App.jsx`**: Top-level controller using MSAL templates
   - `AuthenticatedTemplate`: Shows `AuthenticatedApp` for logged-in users
   - `UnauthenticatedTemplate`: Redirects to Microsoft SSO
   - Uses `useAuth` hook to determine application state

2. **`useAuth` Hook**: Encapsulates all authentication logic
   - Optimistic user setup from MSAL token (no initial backend validation)
   - Global error handling setup for React Query via QueryCache
   - State management for sync status ('success', 'error')
   - "Fail fast" pattern - backend validates user on first API call
   - Automatic error page display when backend rejects user

3. **`LoadingSpinner.jsx`**: Dedicated loading component
   - Shows during initial authentication sync
   - Clean, reusable component with modern styling

4. **`ErrorPage.jsx`**: Full-screen error display
   - No navigation bar interference
   - Retry sync and logout options
   - Complete error state isolation from main app

5. **`AppRouter.jsx`**: Main application routing
   - All routes use `MainLayout` wrapper for consistent navigation
   - Authentication handled at App level by MSAL templates
   - Clean route structure without redundant protection layers

6. **`MainLayout.jsx`**: Layout wrapper for authenticated pages
   - Contains `HeaderNav` and `ScrollToTop` components
   - Only appears after successful authentication and sync
   - Uses React Router `Outlet` pattern for nested routes

#### Authentication Flow

1. **Unauthenticated User**: Direct redirect to Microsoft Azure AD via MSAL templates
2. **Authentication Success**: User info extracted and MSAL `AuthenticatedTemplate` renders
3. **Optimistic User Setup**: `useAuth` hook extracts user info from MSAL token and shows app immediately
4. **First API Call**: Any route (e.g., LandingPage → `/prosjekt`) makes backend request
5. **Backend Validation**: `authJwt` + `setUser` middleware validate token and user existence
6. **Two Outcomes**:
   - ✅ **Valid User**: API succeeds, app works normally
   - ❌ **Invalid User**: 401 error → QueryCache → Error page

#### Error Flow ("Fail Fast" Pattern)

1. **API Call Fails (401)**: React Query QueryCache catches the error
2. **Global Handler**: `useAuth` hook receives the error via QueryCache.onError
3. **State Update**: `syncStatus` changes from 'success' to 'error'
4. **UI Switch**: App.jsx renders `ErrorPage` instead of main app
5. **No Navigation**: Error page is full-screen without header

#### Benefits of This Architecture

1. **Single Responsibility**: Each component has one clear purpose
2. **Centralized Logic**: All auth logic in `useAuth` hook
3. **Clean Separation**: UI components separate from business logic
4. **Fail Fast**: Invalid users discovered immediately on first API call
5. **No Duplication**: Backend middleware is single source of truth for user validation
6. **Optimistic UX**: App shows immediately after Microsoft authentication
7. **Maintainable**: Clear flow from App → useAuth → Components
8. **Testable**: Hook logic easily mockable for testing

#### Error Handling Strategy

- **Optimistic Start**: Show app immediately after MSAL authentication
- **Backend Authority**: Let backend middleware validate user existence
- **No Retries for 401**: Immediate failure for auth errors via QueryCache
- **Global Coverage**: All React Query calls monitored via QueryCache.onError
- **Full-Screen Errors**: Complete UI takeover on auth failure
- **Clean Recovery**: Reload or logout options available

### Backend Integration

The frontend seamlessly integrates with the Express.js backend for user management:

#### JWT Token Handling
- Microsoft tokens are passed directly to backend for validation
- Backend middleware (`authJwt.ts`) validates Microsoft JWT tokens
- Automatic user creation using Microsoft token fields:
  - `oid` → `externalId` (unique Microsoft user identifier)
  - `sub` → `externalId` (fallback if `oid` not available)
  - `preferred_username` → `email`
  - `name` → `name`

#### User Synchronization Process
```javascript
// "Fail Fast" Pattern - No separate validation endpoint needed
// 1. Frontend extracts user info from MSAL token optimistically
// 2. Backend middleware validates on every API request:
//    - authJwt.ts: Validates Microsoft JWT token
//    - setUser.ts: Checks user exists in database
// 3. 401 response triggers immediate error page via QueryCache
```

#### Global Error Handling Setup
```javascript
// queryClient.js - QueryCache approach for global error handling
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error?.response?.status === 401 && globalAuthErrorHandler) {
        globalAuthErrorHandler(error); // Triggers useAuth error state
      }
    }
  })
});
```

#### API Authentication
- All API requests include `Authorization: Bearer <microsoft-jwt>` header
- Backend validates tokens on each request
- 401 responses trigger frontend error handling and logout

## Configuration

### Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:3001
VITE_MSAL_CLIENT_ID=your-azure-app-client-id
VITE_MSAL_TENANT_ID=your-azure-tenant-id
```

### Microsoft Azure AD Setup

The application requires proper Azure AD configuration:
- **Application Registration**: Register app in Azure AD
- **Redirect URIs**: Configure appropriate redirect URLs
- **API Permissions**: Set required permissions for user profile access
- **Token Configuration**: Configure ID token claims

## Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Access to the MOP backend API

### Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   ```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Integration

### Authentication Headers
The application automatically adds required headers to API requests:
- `Authorization: Bearer <jwt-token>` - Microsoft JWT token
- `x-user-id: <user-id>` - Internal user ID for backend operations

### Error Handling
- **401 Unauthorized**: Triggers immediate error page via QueryCache global handler
- **403 Forbidden**: Shows access denied message
- **404 Not Found**: Shows resource not found
- **500 Server Error**: Shows generic error with retry option

### Global Error Architecture
- **QueryCache.onError**: Captures all React Query errors globally
- **No Retries for 401**: Immediate failure to prevent unnecessary requests
- **Centralized Handler**: Single error handler in `useAuth` hook
- **Fail Fast Pattern**: Let backend be authoritative on user validation

## Security Considerations

### Token Storage
- Uses `localStorage` for token caching (configurable in `msalConfig.js`)
- Tokens are automatically refreshed by MSAL library
- Secure token validation on backend

### Content Security Policy
- Implement CSP headers to prevent XSS attacks
- Validate all user inputs
- Sanitize data before rendering

### HTTPS Requirements
- Always serve application over HTTPS in production
- Required for Microsoft Azure AD integration
- Protects token transmission

## Deployment

### Production Build
```bash
npm run build
```

### Docker Support
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Environment-Specific Configuration
- **Development**: Local API, debug logging enabled
- **Staging**: Staging API, reduced logging
- **Production**: Production API, minimal logging, error tracking

## Contributing

### Code Style
- Use Prettier for code formatting
- Follow ESLint configuration
- Use TypeScript for new components (gradual migration)
- Follow React best practices and hooks patterns

### Component Guidelines
- Keep components small and focused
- Use custom hooks for complex logic
- Implement proper error boundaries
- Add loading states for async operations

### Testing
- Unit tests with Jest and React Testing Library
- Integration tests for critical user flows
- E2E tests with Playwright or Cypress

## License

Internal company project - All rights reserved.

## Support

For technical support or questions:
- **Backend Issues**: Contact backend development team
- **Authentication Issues**: Contact system administrator
- **Frontend Bugs**: Create issue in project repository
