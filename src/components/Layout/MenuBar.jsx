import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../LoginModal/LoginModal';
import { logAction } from '../../utils/logger';
import './MenuBar.css';

const MenuBar = () => {
  const { isAuthenticated, logout } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const handleLoginClick = () => {
    logAction('MenuBar', 'Login button clicked');
    setIsLoginModalOpen(true);
  };

  const handleLogoutClick = () => {
    logAction('MenuBar', 'Logout button clicked');
    logout();
  };

  const handleCloseModal = () => {
    logAction('MenuBar', 'Login modal closed');
    setIsLoginModalOpen(false);
  };

  return (
    <>
      <nav className="menu-bar">
        <div className="menu-bar-container">
          <div className="menu-bar-brand">
            <h1>GifCamp</h1>
          </div>
          <div className="menu-bar-actions">
            {isAuthenticated ? (
              <button 
                className="menu-bar-button logout-button"
                onClick={handleLogoutClick}
              >
                Logout
              </button>
            ) : (
              <button 
                className="menu-bar-button login-button"
                onClick={handleLoginClick}
              >
                Login
              </button>
            )}
          </div>
        </div>
      </nav>
      {isLoginModalOpen && (
        <LoginModal onClose={handleCloseModal} />
      )}
    </>
  );
};

export default MenuBar;

