import { createContext, useContext, useState, useEffect } from 'react';
import { logInfo, logWarn, logError, logAction, logApi } from '../utils/logger';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    logInfo('AuthContext', 'Checking for existing session');
    const storedUser = localStorage.getItem('user');
    const storedToken = localStorage.getItem('authToken');
    
    if (storedUser && storedToken) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        setIsAuthenticated(true);
        logInfo('AuthContext', 'Session restored from localStorage', { 
          email: userData.email, 
          method: userData.method 
        });
      } catch (error) {
        logError('AuthContext', 'Error parsing stored user data', error);
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
      }
    } else {
      logInfo('AuthContext', 'No existing session found');
    }
    setLoading(false);
  }, []);

  const login = async (userData, authToken) => {
    logAction('AuthContext', 'Login initiated', { 
      email: userData.email, 
      method: userData.method 
    });
    
    try {
      // Call the HTTP endpoint to record user details and check for errors
      let apiEndpoint = import.meta.env.VITE_API_ENDPOINT;
      
      // In development mode, use the Vite proxy to avoid CORS issues
      // The proxy forwards /api/* to http://localhost:5255/*
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        // Convert http://localhost:5255/login to /api/login
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }
      
      // Log the endpoint value for debugging (always log, not just in dev mode)
      console.log('[AuthContext] VITE_API_ENDPOINT value:', import.meta.env.VITE_API_ENDPOINT);
      console.log('[AuthContext] Using endpoint:', apiEndpoint);
      console.log('[AuthContext] Development mode:', import.meta.env.DEV);
      
      if (apiEndpoint) {
        const requestData = {
          name: userData.name,
          email: userData.email,
          method: userData.method || 'oauth',
          authToken: authToken,
        };
        
        logApi('AuthContext', 'POST', apiEndpoint, requestData);
        console.log('[AuthContext] Sending POST request to:', apiEndpoint);
        console.log('[AuthContext] Request data:', requestData);
        
        try {
          const response = await fetch(apiEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
          });

          console.log('[AuthContext] Response received:', response.status, response.statusText);
          
          // Read response body once - can only be consumed once
          let responseData = {};
          let hasError = false;
          let errorDescription = null;

          try {
            // Try to parse as JSON first (works for both success and error responses)
            const responseText = await response.text();
            if (responseText) {
              try {
                responseData = JSON.parse(responseText);
              } catch {
                // If not JSON, treat responseText as plain text
                responseData = { error: !response.ok, description: responseText };
              }
            }
          } catch (readError) {
            // If we can't read the response at all, treat as error
            logWarn('AuthContext', 'Failed to read response body', readError);
            responseData = { error: true, description: null };
          }

          // Check for errors: HTTP error status OR error field in response
          if (!response.ok || responseData.error === true) {
            hasError = true;
            errorDescription = responseData.description || null;
            
            // If no description and it's an HTTP error, use status text
            if (!errorDescription && !response.ok) {
              errorDescription = `HTTP ${response.status}: ${response.statusText}`;
            }

            logWarn('AuthContext', `API endpoint returned error`, {
              status: response.status,
              statusText: response.statusText,
              error: true,
              description: errorDescription
            });
            console.error('[AuthContext] API error:', response.status, errorDescription);
          } else {
            logApi('AuthContext', 'POST', apiEndpoint, null, responseData);
            logInfo('AuthContext', 'User login successfully recorded in database');
            console.log('[AuthContext] API success:', responseData);
            
            // Merge user data from API response if available (includes userId from backend)
            // Preserve OAuth fields (like picture) that come from Google
            if (responseData.user && typeof responseData.user === 'object') {
              const picture = userData.picture; // Preserve OAuth picture
              const method = userData.method; // Preserve OAuth method
              userData = { ...userData, ...responseData.user };
              // Always preserve OAuth picture and method - API response shouldn't overwrite these
              if (picture) {
                userData.picture = picture;
              }
              if (method) {
                userData.method = method;
              }
            }
          }

          // If there was an error, show message to user
          if (hasError) {
            let errorMessage = 'There was an Error logging you in.';
            if (errorDescription) {
              errorMessage += `\n\n${errorDescription}`;
            }
            alert(errorMessage);
            throw new Error(errorMessage);
          }
        } catch (fetchError) {
          // Network error or other fetch failure
          const errorMessage = 'There was an Error logging you in.';
          if (fetchError.message && !fetchError.message.includes('There was an Error')) {
            // Only add description if it's not already our formatted message
            const description = fetchError.message;
            alert(`${errorMessage}\n\n${description}`);
          } else {
            alert(errorMessage);
          }
          
          logWarn('AuthContext', 'Failed to record user login to API endpoint', {
            error: fetchError.message,
          });
          console.error('[AuthContext] Fetch error:', fetchError);
          console.error('[AuthContext] Error details:', {
            message: fetchError.message,
            stack: fetchError.stack,
            name: fetchError.name
          });
          
          throw fetchError;
        }
      } else {
        logWarn('AuthContext', 'VITE_API_ENDPOINT not configured. User login not recorded to database.');
        console.warn('[AuthContext] VITE_API_ENDPOINT is undefined or empty');
        // If no endpoint is configured, we'll still allow login but warn
      }

      // Only store user data and authenticate if API call succeeded (or no endpoint configured)
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('authToken', authToken);
      
      setUser(userData);
      setIsAuthenticated(true);
      
      logInfo('AuthContext', 'User session stored in localStorage', {
        email: userData.email,
        name: userData.name
      });
      
      logInfo('AuthContext', 'Login completed successfully', {
        email: userData.email
      });
    } catch (error) {
      logError('AuthContext', 'Login error', error);
      throw error;
    }
  };

  const logout = () => {
    logAction('AuthContext', 'Logout initiated', {
      email: user?.email || 'unknown'
    });
    
    localStorage.removeItem('user');
    localStorage.removeItem('authToken');
    setUser(null);
    setIsAuthenticated(false);
    
    logInfo('AuthContext', 'User logged out successfully');
  };

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

