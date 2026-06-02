import React, { useState, useRef, useEffect } from 'react';
import { Plus, TrendingUp, Trash2, X } from 'lucide-react';
import localforage from 'localforage';
import './index.css';
import defaultBanner from './assets/banner.png';
import defaultAvatar from './assets/avatar.png';

// Configure localforage for lifetime storage
localforage.config({
  name: 'TradingGrowthApp',
  storeName: 'profiles'
});

const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        // Compress to JPEG to save significant space and prevent crashes
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
    };
  });
};

function App() {
  // Read-only state for profile details (loaded from local storage)
  const [name, setName] = useState("Anik Adhikari's Growth");
  const [coverPhoto, setCoverPhoto] = useState(defaultBanner);
  const [avatarPhoto, setAvatarPhoto] = useState(defaultAvatar);
  
  // Tabs and content state
  const [activeTab, setActiveTab] = useState<'profits' | 'payouts'>('profits');
  const [profits, setProfits] = useState<string[]>([]);
  const [payouts, setPayouts] = useState<string[]>([]);
  
  // Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [modalAction, setModalAction] = useState<'upload' | 'delete'>('upload');
  const [deleteTarget, setDeleteTarget] = useState<{tab: 'profits'|'payouts', index: number} | null>(null);
  
  // Lightbox state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  // Refs
  const postInputRef = useRef<HTMLInputElement>(null);

  // Load from local storage and IndexedDB on mount
  useEffect(() => {
    const savedName = localStorage.getItem('profile-name');
    const savedCover = localStorage.getItem('profile-cover');
    const savedAvatar = localStorage.getItem('profile-avatar');
    
    if (savedName) setName(savedName);
    if (savedCover) setCoverPhoto(savedCover);
    if (savedAvatar) setAvatarPhoto(savedAvatar);
    
    // Load large arrays from IndexedDB (localforage)
    localforage.getItem<string[]>('profile-profits-v3').then(savedProfits => {
      if (savedProfits) setProfits(savedProfits);
    });
    
    localforage.getItem<string[]>('profile-payouts-v3').then(savedPayouts => {
      if (savedPayouts) setPayouts(savedPayouts);
    });
  }, []);

  // Save posts to IndexedDB when they change
  useEffect(() => {
    localforage.setItem('profile-profits-v3', profits);
  }, [profits]);

  useEffect(() => {
    localforage.setItem('profile-payouts-v3', payouts);
  }, [payouts]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Process all images concurrently and compress them
    const compressedImages = await Promise.all(
      Array.from(files).map(file => compressImage(file))
    );
    
    // Update state only once with all images to prevent React from crashing
    if (activeTab === 'profits') {
      setProfits(prev => [...compressedImages, ...prev]);
    } else {
      setPayouts(prev => [...compressedImages, ...prev]);
    }
    
    // Reset input
    if (postInputRef.current) {
      postInputRef.current.value = '';
    }
  };

  const triggerUpload = () => {
    setModalAction('upload');
    setShowPasswordModal(true);
  };

  const triggerDelete = (tab: 'profits' | 'payouts', index: number) => {
    setDeleteTarget({ tab, index });
    setModalAction('delete');
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'as1as2as3as4as5') {
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
      
      if (modalAction === 'upload') {
        postInputRef.current?.click();
      } else if (modalAction === 'delete' && deleteTarget) {
        if (deleteTarget.tab === 'profits') {
          setProfits(prev => prev.filter((_, i) => i !== deleteTarget.index));
        } else {
          setPayouts(prev => prev.filter((_, i) => i !== deleteTarget.index));
        }
        setDeleteTarget(null);
      }
    } else {
      setPasswordError('Incorrect password. Please try again.');
    }
  };

  const currentPosts = activeTab === 'profits' ? profits : payouts;

  const preventCopy = (e: React.MouseEvent | React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="container" onContextMenu={preventCopy}>
      {/* Cover Photo */}
      <div className="cover-photo-container locked">
        <img 
          src={coverPhoto} 
          alt="Cover" 
          className="cover-photo protected-img" 
          onContextMenu={preventCopy}
          onDragStart={preventCopy}
        />
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-avatar-container locked">
          <img 
            src={avatarPhoto} 
            alt="Avatar" 
            className="profile-avatar protected-img" 
            onContextMenu={preventCopy}
            onDragStart={preventCopy}
          />
        </div>
        
        <div className="profile-info">
          <h1 className="profile-name locked" onContextMenu={preventCopy}>
            {name} <TrendingUp size={24} style={{marginLeft: '4px'}}/>
          </h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'profits' ? 'active' : ''}`}
          onClick={() => setActiveTab('profits')}
        >
          Profits
        </button>
        <button 
          className={`tab ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          Certificates
        </button>
      </div>

      {/* Content Area */}
      <div className="content-area">
        <div className="left-sidebar">
          <button 
            className="add-btn" 
            onClick={triggerUpload}
            title={`Add new ${activeTab === 'profits' ? 'Profit' : 'Certificate'}`}
          >
            <Plus size={24} />
          </button>
          
          <input 
            type="file" 
            accept="image/*" 
            multiple
            className="hidden-file-input" 
            ref={postInputRef}
            onChange={handleImageUpload}
          />
        </div>

        <div className="posts-grid">
          {currentPosts.map((post, index) => (
            <div 
              key={index} 
              className="post-card" 
              onClick={() => setSelectedImage(post)}
              onContextMenu={preventCopy}
            >
              <img 
                src={post} 
                alt={`${activeTab} ${index}`} 
                className="post-image protected-img" 
                onContextMenu={preventCopy}
                onDragStart={preventCopy}
              />
              <button 
                className="delete-btn" 
                onClick={(e) => {
                  e.stopPropagation();
                  triggerDelete(activeTab, index);
                }}
                title="Delete image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          {currentPosts.length === 0 && (
            <div className="empty-state">
              No images yet.
            </div>
          )}
        </div>
      </div>

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Authentication Required</h2>
            <p>
              Please enter the password to {modalAction === 'upload' ? `upload images to ${activeTab === 'profits' ? 'Profits' : 'Certificates'}` : 'delete this image'}.
            </p>
            
            <form onSubmit={handlePasswordSubmit}>
              <input 
                type="password" 
                className="modal-input" 
                placeholder="Enter password..."
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                autoFocus
              />
              {passwordError && <span className="modal-error">{passwordError}</span>}
              
              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                    setPasswordInput('');
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className={modalAction === 'delete' ? "btn-danger" : "btn-primary"}>
                  {modalAction === 'delete' ? 'Delete' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Static Lightbox Modal */}
      {selectedImage && (
        <div className="lightbox-overlay" onClick={() => setSelectedImage(null)}>
          <button 
            className="lightbox-close-btn" 
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
            title="Close"
          >
            <X size={28} color="white" />
          </button>
          
          <img 
            src={selectedImage} 
            alt="Fullscreen" 
            className="lightbox-img protected-img"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
            onContextMenu={preventCopy}
            onDragStart={preventCopy}
          />
        </div>
      )}
    </div>
  );
}

export default App;
