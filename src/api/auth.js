import { API } from './index';

// Manual login API function
export const manualLogin = (email, password) => 
  API.post('/auth/manual/login', { email, password });
