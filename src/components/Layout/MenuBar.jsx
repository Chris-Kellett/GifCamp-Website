import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import LoginModal from '../LoginModal/LoginModal';
import { logAction } from '../../utils/logger';
import './MenuBar.css';

const MenuBar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const placeholderImage = '/assets/placeholder-avatar.png';

  // Reset image error when user changes
  useEffect(() => {
    setImageError(false);
  }, [user]);

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

  const getAvatarSrc = () => {
    // If user has no picture or image error occurred, use placeholder
    if (!user?.picture || imageError) {
      return placeholderImage;
    }
    return user.picture;
  };

  const handleImageError = (e) => {
    // Only set error if the failed image wasn't already the placeholder
    if (e.target.src !== placeholderImage && e.target.src !== window.location.origin + placeholderImage) {
      setImageError(true);
      // Retry with placeholder
      e.target.src = placeholderImage;
    }
  };

  return (
    <>
      <nav className="menu-bar">
        <div className="menu-bar-container">
          <div className="menu-bar-brand">
            <h1>GifCamp</h1>
          </div>
          <div className="menu-bar-actions">
            {isAuthenticated && user ? (
              <div className="menu-bar-user-info">
                <img 
                  src={getAvatarSrc()} 
                  alt={user.name} 
                  className="menu-bar-avatar"
                  onError={handleImageError}
                />
                <span className="menu-bar-user-name">{user.name}</span>
                <button 
                  className="menu-bar-button logout-button"
                  onClick={handleLogoutClick}
                >
                  Logout
                </button>
              </div>
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

