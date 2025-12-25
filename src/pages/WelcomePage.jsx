import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { logInfo } from '../utils/logger';
import './WelcomePage.css';

const WelcomePage = () => {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    logInfo('WelcomePage', 'Welcome page loaded', { isAuthenticated });
  }, [isAuthenticated]);

  return (
    <div className="welcome-page">
      <div className="welcome-content">
        <h1>Welcome to GifCamp</h1>
        <p>Please log in to continue.</p>
      </div>
    </div>
  );
};

export default WelcomePage;

