import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logAction, logError, logInfo } from '../../utils/logger';
import './CreateCategoryModal.css';

const CreateCategoryModal = ({ onClose, onCategoryCreated }) => {
  const { user } = useAuth();
  const [categoryName, setCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    logAction('CreateCategoryModal', 'Modal closed by user');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logAction('CreateCategoryModal', 'Creating category', { name: categoryName });

      // Get the API endpoint from environment variable
      let apiEndpoint = import.meta.env.VITE_CATEGORIES_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Categories API endpoint not configured');
      }
      
      // In development mode, use the Vite proxy
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      // Get userId as a number from user object
      // The user object should have an id field (number) from the login response
      const userId = user?.id;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId, // Ensure it's a number
        name: categoryName.trim(),
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      // Read response once
      const responseText = await response.text();
      let responseData = {};
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: !response.ok, description: responseText, categoryId: null };
        }
      }

      // Check for errors: HTTP error status OR error field in response
      if (!response.ok) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorDescription);
        logError('CreateCategoryModal', 'Failed to create category', { error: errorDescription });
        return;
      }

      // Check if response indicates an error
      if (responseData.error === true) {
        const errorDescription = responseData.description || 'An error occurred while creating the category';
        setError(errorDescription);
        logError('CreateCategoryModal', 'API returned error', { 
          error: true, 
          description: errorDescription,
          categoryId: responseData.categoryId 
        });
        return;
      }

      logInfo('CreateCategoryModal', 'Category created successfully', {
        categoryId: responseData.categoryId,
        error: responseData.error
      });
      
      // Reset form and close modal
      setCategoryName('');
      onClose();
      
      // Notify parent to refresh categories
      if (onCategoryCreated) {
        onCategoryCreated();
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to create category';
      setError(errorMessage);
      logError('CreateCategoryModal', 'Error creating category', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Category</h2>
          <button className="modal-close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="category-name">Name</label>
              <input
                id="category-name"
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
                disabled={isSubmitting}
                autoFocus
              />
            </div>
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button button-primary"
                disabled={isSubmitting || !categoryName.trim()}
              >
                {isSubmitting ? 'Creating...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateCategoryModal;

