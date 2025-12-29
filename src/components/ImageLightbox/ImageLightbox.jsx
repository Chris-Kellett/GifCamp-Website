import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logAction, logError, logInfo } from '../../utils/logger';
import './ImageLightbox.css';

const ImageLightbox = ({ image, onClose, onDelete }) => {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [loadingTags, setLoadingTags] = useState(false);
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

  // Fetch tags when image changes
  useEffect(() => {
    if (image && image.id && user) {
      fetchTags();
    }
  }, [image, user]);

  const fetchTags = async () => {
    if (!user || !image || !image.id) return;

    setLoadingTags(true);
    try {
      logAction('ImageLightbox', 'Fetching tags', { imageId: image.id });

      const userId = user.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      let apiEndpoint = import.meta.env.VITE_IMAGES_GET_IMAGE_TAGS_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Images get image tags API endpoint not configured');
      }
      
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        imageId: typeof image.id === 'string' ? parseInt(image.id, 10) : image.id,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      let responseData = {};
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: !response.ok, description: responseText, tags: [] };
        }
      }

      if (!response.ok || responseData.error === true) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        logError('ImageLightbox', 'Failed to fetch tags', { error: errorDescription });
        setTags([]);
        return;
      }

      const tagList = Array.isArray(responseData.tags) ? responseData.tags : [];
      logInfo('ImageLightbox', 'Tags fetched successfully', { count: tagList.length });
      setTags(tagList);
    } catch (error) {
      logError('ImageLightbox', 'Error fetching tags', error);
      setTags([]);
    } finally {
      setLoadingTags(false);
    }
  };

  const handleTagInputChange = async (e) => {
    const value = e.target.value;
    setTagInput(value);

    // Check if comma was entered
    if (value.endsWith(',')) {
      const tagName = value.slice(0, -1).trim();
      if (tagName) {
        await addTag(tagName);
        setTagInput('');
      } else {
        setTagInput('');
      }
    }
  };

  const addTag = async (tagName) => {
    if (!user || !image || !image.id || !tagName.trim()) return;

    try {
      logAction('ImageLightbox', 'Adding tag', { imageId: image.id, tag: tagName });

      const userId = user.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      let apiEndpoint = import.meta.env.VITE_IMAGES_ADD_IMAGE_TAG_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Images add image tag API endpoint not configured');
      }
      
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        imageId: typeof image.id === 'string' ? parseInt(image.id, 10) : image.id,
        tag: tagName.trim(),
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      let responseData = {};
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: !response.ok, description: responseText };
        }
      }

      if (!response.ok || responseData.error === true) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        logError('ImageLightbox', 'Failed to add tag', { error: errorDescription });
        return;
      }

      logInfo('ImageLightbox', 'Tag added successfully', responseData);
      
      // Refresh tags list
      fetchTags();
    } catch (error) {
      logError('ImageLightbox', 'Error adding tag', error);
    }
  };

  const handleDeleteTag = async (tagId) => {
    if (!user || !image || !image.id) return;

    try {
      logAction('ImageLightbox', 'Deleting tag', { imageId: image.id, tagId });

      const userId = user.id;
      if (!userId) {
        throw new Error('User ID not found');
      }

      let apiEndpoint = import.meta.env.VITE_IMAGES_DELETE_IMAGE_TAG_API_ENDPOINT;
      
      if (!apiEndpoint) {
        throw new Error('Images delete image tag API endpoint not configured');
      }
      
      if (import.meta.env.DEV && apiEndpoint && apiEndpoint.includes('localhost:5255')) {
        const url = new URL(apiEndpoint);
        apiEndpoint = `/api${url.pathname}${url.search}`;
      }

      const requestData = {
        userId: typeof userId === 'string' ? parseInt(userId, 10) : userId,
        imageId: typeof image.id === 'string' ? parseInt(image.id, 10) : image.id,
        tagId: typeof tagId === 'string' ? parseInt(tagId, 10) : tagId,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseText = await response.text();
      let responseData = {};
      
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: !response.ok, description: responseText };
        }
      }

      if (!response.ok || responseData.error === true) {
        const errorDescription = responseData.description || `HTTP ${response.status}: ${response.statusText}`;
        logError('ImageLightbox', 'Failed to delete tag', { error: errorDescription });
        return;
      }

      logInfo('ImageLightbox', 'Tag deleted successfully', responseData);
      
      // Refresh tags list
      fetchTags();
    } catch (error) {
      logError('ImageLightbox', 'Error deleting tag', error);
    }
  };

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

        <div className="image-lightbox-main-content">
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

          <div className="image-lightbox-divider"></div>

          <div className="image-lightbox-tags-section">
            <div className="image-lightbox-tags-header">
              <svg 
                className="image-lightbox-tag-icon" 
                width="20" 
                height="20" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                <line x1="7" y1="7" x2="7.01" y2="7"></line>
              </svg>
              <h3 className="image-lightbox-tags-title">Tags</h3>
            </div>

            <div className="image-lightbox-tags-list">
              {loadingTags ? (
                <div className="image-lightbox-tags-loading">Loading tags...</div>
              ) : tags.length === 0 ? (
                <div className="image-lightbox-tag image-lightbox-tag-empty">No tags</div>
              ) : (
                tags.map((tag) => (
                  <div key={tag.id} className="image-lightbox-tag">
                    <span className="image-lightbox-tag-name">{tag.tag || tag.Tag}</span>
                    <button
                      className="image-lightbox-tag-delete"
                      onClick={() => handleDeleteTag(tag.id || tag.Id)}
                      title="Delete tag"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
            </div>

            <input
              type="text"
              className="image-lightbox-tag-input"
              placeholder="Add tags (separate with comma,)"
              value={tagInput}
              onChange={handleTagInputChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;

