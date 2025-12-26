import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logAction, logError } from '../../utils/logger';
import './ImageLightbox.css';

const ImageLightbox = ({ image, onClose, onDelete }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const deleteConfirmTimeoutRef = useRef(null);

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (deleteConfirmTimeoutRef.current) {
        clearTimeout(deleteConfirmTimeoutRef.current);
      }
    };
  }, []);

  const handleCopyLink = async () => {
    const imageUrl = image.url || image;
    try {
      await navigator.clipboard.writeText(imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
      logAction('ImageLightbox', 'Image URL copied to clipboard', { imageId: image.id });
    } catch (error) {
      logError('ImageLightbox', 'Failed to copy image URL', error);
    }
  };

  const handleDeleteClick = async () => {
    if (deleteConfirm) {
      // Second click - confirm delete
      if (deleteConfirmTimeoutRef.current) {
        clearTimeout(deleteConfirmTimeoutRef.current);
      }
      setDeleteConfirm(false);
      await onDelete(image);
      onClose();
    } else {
      // First click - show confirm
      setDeleteConfirm(true);
      
      // Clear any existing timeout
      if (deleteConfirmTimeoutRef.current) {
        clearTimeout(deleteConfirmTimeoutRef.current);
      }
      
      // Revert after 3 seconds
      deleteConfirmTimeoutRef.current = setTimeout(() => {
        setDeleteConfirm(false);
      }, 3000);
      
      logAction('ImageLightbox', 'Delete confirmation shown', { imageId: image.id });
    }
  };

  const getCategoryName = () => {
    // Use categoryName from the image object if available
    if (image.categoryName) {
      return image.categoryName;
    }
    // Fallback to checking categoryId
    if (image.categoryId === 0 || image.categoryId === null || image.categoryId === undefined) {
      return 'Uncategorised';
    }
    // Final fallback
    return 'Uncategorised';
  };

  const imageUrl = image.url || image;

  return (
    <div className="image-lightbox-overlay" onClick={onClose}>
      <div className="image-lightbox-content" onClick={(e) => e.stopPropagation()}>
        <button className="image-lightbox-close" onClick={onClose}>
          ×
        </button>
        
        <div className="image-lightbox-image-container">
          <img 
            src={imageUrl} 
            alt={`Image ${image.id || ''}`}
            className="image-lightbox-image"
            onError={(e) => {
              console.error('Failed to load image:', imageUrl);
              e.target.style.display = 'none';
            }}
          />
        </div>

        <div className="image-lightbox-details">
          <div className="image-lightbox-detail-row">
            <span className="image-lightbox-detail-label">Category:</span>
            <span className="image-lightbox-detail-value">{getCategoryName()}</span>
          </div>

          <div className="image-lightbox-detail-row">
            <span className="image-lightbox-detail-label">Image URL:</span>
            <input
              type="text"
              className="image-lightbox-url-input"
              value={imageUrl}
              readOnly
              onClick={(e) => e.target.select()}
            />
          </div>

          <div className="image-lightbox-actions">
            <button
              className="image-lightbox-copy-button"
              onClick={handleCopyLink}
            >
              {copied ? 'Copied ✓' : 'Copy Link'}
            </button>
            <button
              className="image-lightbox-delete-button"
              onClick={handleDeleteClick}
            >
              {deleteConfirm ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;

