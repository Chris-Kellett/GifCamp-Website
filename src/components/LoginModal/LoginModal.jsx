import { useEffect } from 'react';
import { GoogleOAuthProvider, useGoogleLogin } from '@react-oauth/google';
import { useAuth } from '../../contexts/AuthContext';
import { logInfo, logWarn, logError, logAction, logApi } from '../../utils/logger';
import './LoginModal.css';

const LoginContent = ({ onClose }) => {
  const { login } = useAuth();

  const handleClose = () => {
    logAction('LoginModal', 'Login modal closed by user');
    onClose();
  };

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      logAction('LoginModal', 'Google OAuth token received');
      
      try {
        logApi('LoginModal', 'GET', 'https://www.googleapis.com/oauth2/v3/userinfo');
        
        // Fetch user info from Google
        const userInfoResponse = await fetch(
          'https://www.googleapis.com/oauth2/v3/userinfo',
          {
            headers: {
              Authorization: `Bearer ${tokenResponse.access_token}`,
            },
          }
        );

        if (!userInfoResponse.ok) {
          const errorText = await userInfoResponse.text();
          logError('LoginModal', 'Google API error response', {
            status: userInfoResponse.status,
            statusText: userInfoResponse.statusText,
            error: errorText
          });
          throw new Error(`Failed to fetch user info: ${userInfoResponse.status} ${userInfoResponse.statusText}`);
        }

        const userInfo = await userInfoResponse.json();
        logApi('LoginModal', 'GET', 'https://www.googleapis.com/oauth2/v3/userinfo', null, {
          email: userInfo.email,
          name: userInfo.name
        });
        
        // Check if Google returned an error in the response
        if (userInfo.error) {
          logError('LoginModal', 'Google API returned error in response', userInfo.error);
          throw new Error(`Google API error: ${userInfo.error.message || userInfo.error}`);
        }
        
        // Validate required fields
        if (!userInfo.email) {
          logError('LoginModal', 'Google account does not have an email address');
          throw new Error('Google account does not have an email address');
        }

        // Prepare user data
        const userData = {
          name: userInfo.name || userInfo.email,
          email: userInfo.email,
          picture: userInfo.picture,
          method: 'google',
        };

        logInfo('LoginModal', 'User data prepared from Google OAuth', {
          email: userData.email,
          name: userData.name
        });

        // Call login function which will handle the API endpoint call
        await login(userData, tokenResponse.access_token);
        
        logAction('LoginModal', 'Login modal closing after successful authentication');
        onClose();
      } catch (error) {
        logError('LoginModal', 'Google login error', error);
        // Only show alert if AuthContext hasn't already shown one
        // AuthContext shows "There was an Error logging you in." format
        const errorMessage = error.message || 'Unknown error occurred';
        if (!errorMessage.includes('There was an Error logging you in')) {
          alert(`Failed to login: ${errorMessage}.`);
        }
      }
    },
    onError: (error) => {
      logError('LoginModal', 'Google OAuth error', error);
      alert('Failed to login with Google. Please try again.');
    },
  });

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Login</h2>
          <button className="modal-close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>Choose an authentication method to continue:</p>
          <div className="login-options">
            <button
              className="oauth-button google-button"
              onClick={handleGoogleLogin}
            >
              <svg
                className="oauth-icon"
                viewBox="0 0 24 24"
                width="20"
                height="20"
              >
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoginModal = ({ onClose }) => {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    logAction('LoginModal', 'Login modal opened');
  }, []);

  if (!googleClientId) {
    logError('LoginModal', 'Google Client ID is not configured');
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Login</h2>
            <button className="modal-close-button" onClick={onClose}>
              ×
            </button>
          </div>
          <div className="modal-body">
            <p style={{ color: '#e74c3c' }}>
              OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.
            </p>
          </div>
        </div>
      </div>
    );
  }

  logInfo('LoginModal', 'Initializing Google OAuth provider', {
    hasClientId: !!googleClientId
  });

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <LoginContent onClose={onClose} />
    </GoogleOAuthProvider>
  );
};

export default LoginModal;

