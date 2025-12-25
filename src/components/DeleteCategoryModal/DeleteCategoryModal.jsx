import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logAction, logError, logInfo } from '../../utils/logger';
import './DeleteCategoryModal.css';

const DeleteCategoryModal = ({ onClose, category, onCategoryDeleted }) => {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleClose = () => {
    logAction('DeleteCategoryModal', 'Modal closed by user');
    onClose();
  };

  const handleConfirm = async () => {
    if (!category || !user) return;

    setIsSubmitting(true);
    setError(null);

    try {
      logAction('DeleteCategoryModal', 'Deleting category', { 
        categoryId: category.id, 
        categoryName: category.name 
      });

      // Get the API endpoint from environment variable
      let apiEndpoint = import.meta.env.VITE_CATEGORIES_DELETE_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Categories delete API endpoint not configured');
      }
      
      // In development mode, use the Vite proxy
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      // Get userId as a number
      const userId = user.id;
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        categoryId: typeof category.id === 'string' ? parseInt(category.id, 10) : category.id,
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
          responseData = { error: !response.ok, description: responseText };
        }
      }

      // Check for errors: HTTP error status OR error field in response
      if (!response.ok) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        setError(errorDescription);
        logError('DeleteCategoryModal', 'Failed to delete category', { error: errorDescription });
        return;
      }

      // Check if response indicates an error
      if (responseData.error === true) {
        const errorDescription = responseData.description || 'An error occurred while deleting the category';
        setError(errorDescription);
        logError('DeleteCategoryModal', 'API returned error', { 
          error: true, 
          description: errorDescription
        });
        return;
      }

      logInfo('DeleteCategoryModal', 'Category deleted successfully', responseData);
      
      // Close modal and notify parent to refresh categories
      onClose();
      
      if (onCategoryDeleted) {
        onCategoryDeleted();
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to delete category';
      setError(errorMessage);
      logError('DeleteCategoryModal', 'Error deleting category', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Delete Category</h2>
          <button className="modal-close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <p>
            Are you sure you want to delete the '<strong>{category?.name}</strong>' Category? This cannot be undone.
          </p>
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
              type="button"
              className="button button-primary button-danger"
              onClick={handleConfirm}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Confirm'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteCategoryModal;

