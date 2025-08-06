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

## Project Structure

```
src/
├── api/                    # API layer
│   ├── index.js           # Main API client with interceptors
│   ├── userApi.js         # User-related API calls
│   └── prosjektApi.js     # Project-related API calls
├── components/            # Reusable components
│   ├── AuthSync.jsx       # Authentication synchronization
│   ├── RowNew.jsx         # Generic form for creating records
│   ├── RowEdit.jsx        # Generic form for editing records
│   └── AdminPage.jsx      # Admin dashboard components
├── pages/                 # Page components
│   ├── LandingPage.jsx    # Main dashboard/landing page
│   ├── LoginPage.jsx      # Error handling and manual login
│   ├── Brukeradministrasjon.jsx      # User administration
│   ├── Prosjektadministrasjon.jsx    # Project administration
│   ├── TiltaksoversiktGenerelle.jsx  # General tasks overview
│   └── TiltaksoversiktProsjekt.jsx   # Project-specific tasks
├── stores/                # State management
│   ├── store.js          # Main store configuration
│   └── userStore.js      # User-specific state
├── config/               # Configuration files
├── App.jsx              # Main application component
├── AppRouter.jsx        # Route definitions
├── HeaderNav.jsx        # Navigation component
├── main.jsx            # Application entry point
└── msalConfig.js       # Microsoft authentication configuration
```

## Authentication Flow

### Traditional Microsoft SSO Pattern

1. **Initial Access**: User visits any protected route
2. **Direct Redirect**: Automatically redirected to Microsoft Azure AD
3. **Authentication**: User authenticates with Microsoft credentials
4. **Token Return**: Microsoft redirects back with authentication tokens
5. **User Sync**: `AuthSync` component checks/creates user in backend
6. **App Access**: User gains access to the intended page

### Automatic User Creation

When a user authenticates for the first time:
- System extracts user info from Microsoft token (`externalId`, `name`, `email`)
- Checks if user exists in backend database
- If not found, automatically creates user with default settings:
  - Role: 'user'
  - Unit: Default unit (enhet1Id: 1)
- Sets user in global application state

### Error Handling

- **Login Page**: Serves as error handler for authentication failures
- **Detailed Feedback**: Shows specific error messages from Microsoft SSO
- **Recovery Options**: Retry login or return to application
- **Sync Errors**: Visual feedback for backend synchronization issues

## Error Handling Architecture

### Centralized Authentication Management

The application uses a clean, centralized approach for handling authentication and error states:

#### useAuth Custom Hook

```javascript
// hooks/useAuth.js
export const useAuth = () => {
  const { accounts, instance } = useMsal();
  const setUser = useUserStore(state => state.setUser);
  const [syncStatus, setSyncStatus] = useState('syncing');
  const [syncError, setSyncError] = useState(null);

  // Sets up global error handler for React Query
  // Handles user synchronization with backend
  // Returns: { syncStatus, syncError, instance }
};
```

#### App.jsx - Central Controller

The main `App.jsx` component acts as the central controller:

```javascript
function AuthenticatedApp() {
  const { syncStatus, syncError } = useAuth();

  if (syncStatus === 'syncing') return <LoadingSpinner />;
  if (syncStatus === 'error') return <ErrorPage error={syncError} />;
  return <AppRouter />;
}
```

#### Component Architecture

1. **`App.jsx`**: Top-level controller using MSAL templates
   - `AuthenticatedTemplate`: Shows `AuthenticatedApp` for logged-in users
   - `UnauthenticatedTemplate`: Redirects to Microsoft SSO

2. **`useAuth` Hook**: Encapsulates all authentication logic
   - User synchronization with backend
   - Global error handling for React Query
   - State management for sync status

3. **`LoadingSpinner.jsx`**: Dedicated loading component
   - Shows during initial authentication sync
   - Clean, reusable component

4. **`ErrorPage.jsx`**: Full-screen error display
   - No navigation bar interference
   - Retry and logout options
   - Clean error presentation

5. **`AppRouter.jsx`**: Main application routing
   - Uses nested route structure with `ProtectedRoute`
   - `MainLayout` component wraps all authenticated pages

6. **`MainLayout.jsx`**: Layout wrapper for authenticated pages
   - Contains `HeaderNav` and `ScrollToTop`
   - Only appears after successful authentication

#### Authentication Flow

1. **Unauthenticated User**: Direct redirect to Microsoft Azure AD
2. **Authentication Success**: User info extracted and stored
3. **User Sync**: Backend automatically creates/validates user
4. **App Access**: Main application router with protected routes
5. **Runtime Errors**: 401 errors trigger full-screen error page

#### Error Flow

1. **API Call Fails (401)**: React Query catches the error
2. **Global Handler**: `useAuth` hook receives the error
3. **State Update**: `syncStatus` changes to 'error'
4. **UI Switch**: App.jsx renders `ErrorPage` instead of main app
5. **No Navigation**: Error page is full-screen without header

#### Benefits of This Architecture

1. **Single Responsibility**: Each component has one clear purpose
2. **Centralized Logic**: All auth logic in `useAuth` hook
3. **Clean Separation**: UI components separate from business logic
4. **Reusable**: Hook can be used by any component needing auth state
5. **Maintainable**: Clear flow from App → useAuth → Components
6. **Testable**: Hook logic easily mockable for testing

#### Error Handling Strategy

- **No Retries for 401**: Immediate failure for auth errors
- **Global Coverage**: All React Query calls monitored
- **Full-Screen Errors**: Complete UI takeover on auth failure
- **Clean Recovery**: Reload or logout options available

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
- **401 Unauthorized**: Redirects to Microsoft authentication
- **403 Forbidden**: Shows access denied message
- **404 Not Found**: Shows resource not found
- **500 Server Error**: Shows generic error with retry option

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
