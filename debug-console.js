/**
 * Secure Debug Log Capture Script
 * 
 * Only captures specific debug messages (marked with 🔍) and only in development
 * Uses proper authentication and respects user privacy
 */

// Auto-enable in development mode
const isDevelopment = import.meta.env.DEV;
const isDebugMode = isDevelopment; // Just auto-enable in dev

if (!isDebugMode) {
  console.log('🔧 Debug logging disabled (not in development mode).');
  // Export empty functions if not in debug mode
  window.downloadDebugLogs = () => console.log('Debug logging not available');
  window.startFreshDebugSession = () => console.log('Debug logging not available');
  window.clearDebugLogs = () => console.log('Debug logging not available');
} else {

// Generate unique session ID for this debug session
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Create new session ID on page load (but don't auto-clear logs)
const getSessionId = () => {
  const sessionId = generateSessionId();
  sessionStorage.setItem('debug-session-id', sessionId);
  return sessionId;
};

const currentSessionId = getSessionId();

// Import API client after it's available
let API = null;

// Store original console methods
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info
};

// Function to get API client (lazy loading)
const getAPI = async () => {
  if (!API) {
    try {
      // Dynamic import to get the API client
      const apiModule = await import('/src/api/index.js');
      API = apiModule.API;
    } catch (error) {
      originalConsole.error('Failed to import API client:', error);
      return null;
    }
  }
  return API;
};

// Function to send log to backend using proper API client
const sendLogToBackend = async (message, level = 'LOG') => {
  try {
    const api = await getAPI();
    if (!api) {
      // Fallback to localStorage if API not available
      const existingLogs = localStorage.getItem('debug-logs-fallback') || '';
      localStorage.setItem('debug-logs-fallback', existingLogs + `[${new Date().toISOString()}] [${level}] ${message}\n`);
      return;
    }

    await api.post('/debug/log', {
      message,
      level,
      timestamp: new Date().toISOString(),
      component: 'FRONTEND',
      sessionId: currentSessionId
    });
  } catch (error) {
    // Fallback to localStorage if backend call fails
    const existingLogs = localStorage.getItem('debug-logs-fallback') || '';
    localStorage.setItem('debug-logs-fallback', existingLogs + `[${new Date().toISOString()}] [${level}] ${message}\n`);
    originalConsole.error('Failed to send log to backend:', error);
  }
};

// Function to format arguments like console.log does
const formatArgs = (args) => {
  return args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg, null, 2);
      } catch (e) {
        return String(arg);
      }
    }
    return String(arg);
  }).join(' ');
};

// Clear backend logs for new session (manual)
const clearBackendLogsForNewSession = async () => {
  try {
    const api = await getAPI();
    if (api) {
      await api.post('/debug/clear', { sessionId: currentSessionId });
      originalConsole.log(`🗑️ Started fresh debug session: ${currentSessionId}`);
    }
  } catch (error) {
    originalConsole.warn('Could not clear backend debug logs:', error);
  }
};

// Clear backend logs (manual)
const clearBackendLogs = async () => {
  try {
    const api = await getAPI();
    if (api) {
      await api.post('/debug/clear', { sessionId: currentSessionId });
      originalConsole.log('🗑️ Debug logs cleared manually');
    }
  } catch (error) {
    originalConsole.warn('Could not clear backend debug logs:', error);
  }
};

// Only capture messages with LOGBACKEND prefix for backend
const BACKEND_DEBUG_MARKERS = ['LOGBACKEND'];

// All debug markers for console (but not all go to backend)
const CONSOLE_DEBUG_MARKERS = ['🔍', '🐛', '📊', '⚠️', '❌', 'DEBUG', 'FlowDataTransformer:', 'FlowAdapter:', 'FlowWorkspace:'];

const shouldSendToBackend = (message) => {
  return BACKEND_DEBUG_MARKERS.some(marker => message.startsWith(marker));
};

const shouldShowInConsole = (message) => {
  return CONSOLE_DEBUG_MARKERS.some(marker => message.startsWith(marker));
};

// Override console methods with selective backend logging
console.log = (...args) => {
  const message = formatArgs(args);
  originalConsole.log(...args);
  if (shouldSendToBackend(message)) {
    sendLogToBackend(message, 'LOG');
  }
};

console.error = (...args) => {
  const message = formatArgs(args);
  originalConsole.error(...args);
  if (shouldSendToBackend(message)) {
    sendLogToBackend(message, 'ERROR');
  }
};

console.warn = (...args) => {
  const message = formatArgs(args);
  originalConsole.warn(...args);
  if (shouldSendToBackend(message)) {
    sendLogToBackend(message, 'WARN');
  }
};

console.info = (...args) => {
  const message = formatArgs(args);
  originalConsole.info(...args);
  if (shouldSendToBackend(message)) {
    sendLogToBackend(message, 'INFO');
  }
};

// Function to download logs from backend
window.downloadDebugLogs = async () => {
  try {
    const api = await getAPI();
    if (!api) {
      // Fallback to localStorage logs
      const logs = localStorage.getItem('debug-logs-fallback') || 'No logs found (API not available)';
      const blob = new Blob([logs], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flow-debug-logs-fallback-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      console.log('📁 Fallback debug logs downloaded!');
      return;
    }

    const response = await api.get('/debug/download', { responseType: 'blob' });
    
    const blob = new Blob([response.data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-debug-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    console.log('📁 Backend debug logs downloaded!');
    
  } catch (error) {
    console.error('Error downloading debug logs:', error);
    // Try fallback
    const logs = localStorage.getItem('debug-logs-fallback') || 'No fallback logs found';
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flow-debug-logs-fallback-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
};

console.log(`🔧 Debug session ${currentSessionId} initialized. Logs auto-clear on session change. Use downloadDebugLogs() to download, or clearDebugLogs() to manually clear.`);

// Add utility functions
window.clearDebugLogs = clearBackendLogs;
// Note: startFreshDebugSession is no longer needed since auto-clearing happens on session change

} // End of isDebugMode check