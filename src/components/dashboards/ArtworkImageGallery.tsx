import React, { useState, useRef, useCallback, useEffect } from 'react';

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

interface GalleryImage {
  id?: number;
  image_url: string;
  display_order: number;
  is_mockup: boolean;
  isNew?: boolean;
  file?: File;
  previewUrl?: string;
}

interface ArtworkImageGalleryProps {
  artworkId?: number;
  primaryImage: string | null;
  galleryImages: GalleryImage[];
  onPrimaryImageChange: (file: File | string | null) => void;
  onGalleryImagesChange: (images: GalleryImage[]) => void;
  isEditing: boolean;
  maxImages?: number;
}

export function ArtworkImageGallery({
  artworkId,
  primaryImage,
  galleryImages,
  onPrimaryImageChange,
  onGalleryImagesChange,
  isEditing,
  maxImages = 4
}: ArtworkImageGalleryProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = useState<number | null>(null);
  const [newPrimaryFile, setNewPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const [showStudioWarning, setShowStudioWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNewPrimaryFile(null);
    setPrimaryPreview(null);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  }, [artworkId, isEditing]);

  const allImages: GalleryImage[] = [
    ...(primaryImage || newPrimaryFile ? [{
      id: -1,
      image_url: primaryPreview || primaryImage || '',
      display_order: 0,
      is_mockup: false,
      isNew: !!newPrimaryFile,
      file: newPrimaryFile || undefined,
      previewUrl: primaryPreview || undefined
    }] : []),
    ...galleryImages
  ];

  const handleMultiFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>, fromCoverSlot: boolean = false) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const hasPrimary = !!(primaryImage || newPrimaryFile);
    const filesList = Array.from(files);
    const currentGalleryCount = galleryImages.length;
    
    if (fromCoverSlot) {
      const coverFile = filesList[0];
      const additionalFiles = filesList.slice(1);
      
      let updatedGallery = [...galleryImages];
      
      if (newPrimaryFile && currentGalleryCount < maxImages - 1) {
        const demotedCover: GalleryImage = {
          id: Date.now(),
          image_url: primaryPreview || '',
          display_order: 0,
          is_mockup: false,
          isNew: true,
          file: newPrimaryFile,
          previewUrl: primaryPreview || undefined
        };
        updatedGallery = [demotedCover, ...galleryImages.map((img, i) => ({
          ...img,
          display_order: i + 1
        }))];
      }
      
      setNewPrimaryFile(coverFile);
      onPrimaryImageChange(coverFile);
      const coverReader = new FileReader();
      coverReader.onload = () => setPrimaryPreview(coverReader.result as string);
      coverReader.readAsDataURL(coverFile);
      
      const remainingSlots = maxImages - 1 - updatedGallery.length;
      const filesToAdd = additionalFiles.slice(0, Math.max(0, remainingSlots));
      
      if (filesToAdd.length > 0) {
        const newImages: (GalleryImage | null)[] = new Array(filesToAdd.length).fill(null);
        let processed = 0;
        
        filesToAdd.forEach((file, index) => {
          const reader = new FileReader();
          reader.onload = () => {
            newImages[index] = {
              image_url: reader.result as string,
              display_order: updatedGallery.length + index,
              is_mockup: false,
              isNew: true,
              file,
              previewUrl: reader.result as string
            };
            processed++;
            
            if (processed === filesToAdd.length) {
              const orderedImages = newImages.filter((img): img is GalleryImage => img !== null);
              onGalleryImagesChange([...updatedGallery, ...orderedImages]);
            }
          };
          reader.readAsDataURL(file);
        });
      } else {
        onGalleryImagesChange(updatedGallery);
      }
    } else {
      const remainingSlots = maxImages - 1 - currentGalleryCount - (hasPrimary ? 0 : 0);
      const effectiveRemaining = hasPrimary ? maxImages - 1 - currentGalleryCount : maxImages - currentGalleryCount;
      const filesToProcess = filesList.slice(0, Math.max(0, effectiveRemaining));
      
      if (filesToProcess.length === 0) return;
      
      const newImages: (GalleryImage | null)[] = new Array(filesToProcess.length).fill(null);
      let processed = 0;
      
      filesToProcess.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = () => {
          newImages[index] = {
            image_url: reader.result as string,
            display_order: currentGalleryCount + index,
            is_mockup: false,
            isNew: true,
            file,
            previewUrl: reader.result as string
          };
          processed++;
          
          if (processed === filesToProcess.length) {
            const orderedImages = newImages.filter((img): img is GalleryImage => img !== null);
            onGalleryImagesChange([...galleryImages, ...orderedImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    
    e.target.value = '';
  }, [primaryImage, newPrimaryFile, primaryPreview, galleryImages, maxImages, onPrimaryImageChange, onGalleryImagesChange]);

  const handleRemoveImage = useCallback((index: number) => {
    if (index === 0 && (primaryImage || newPrimaryFile)) {
      setNewPrimaryFile(null);
      setPrimaryPreview(null);
      onPrimaryImageChange(null);
    } else {
      const adjustedIndex = (primaryImage || newPrimaryFile) ? index - 1 : index;
      const updated = galleryImages.filter((_, i) => i !== adjustedIndex);
      onGalleryImagesChange(updated);
    }
  }, [primaryImage, newPrimaryFile, galleryImages, onPrimaryImageChange, onGalleryImagesChange]);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(index));
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedIndex !== null && draggedIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDropTargetIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    setDropTargetIndex(null);
    
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      return;
    }
    
    // Create a stable copy of allImages for reordering
    const imagesCopy = allImages.map((img, idx) => ({
      ...img,
      _originalIndex: idx
    }));
    
    // Perform the swap
    const draggedItem = imagesCopy[draggedIndex];
    imagesCopy.splice(draggedIndex, 1);
    imagesCopy.splice(targetIndex, 0, draggedItem);
    
    // Determine the new cover (first image after reorder)
    const newCover = imagesCopy[0];
    const oldCoverWasPrimary = draggedIndex !== 0 && targetIndex === 0 || (draggedIndex === 0 && targetIndex !== 0);
    
    // Update the primary image
    if (newCover) {
      if (newCover.file) {
        // New file being promoted to cover
        setNewPrimaryFile(newCover.file);
        setPrimaryPreview(newCover.previewUrl || newCover.image_url);
        onPrimaryImageChange(newCover.file);
      } else {
        // Existing image being promoted to cover - pass URL with gallery image ID
        setNewPrimaryFile(null);
        // Keep the preview showing the new cover image URL
        setPrimaryPreview(newCover.previewUrl || newCover.image_url);
        // Pass an object with the image info so the parent can track it
        const promotedImageInfo = newCover.id && newCover.id > 0 
          ? { type: 'gallery', id: newCover.id, url: newCover.image_url }
          : newCover.image_url;
        onPrimaryImageChange(promotedImageInfo as any);
      }
    }
    
    // Update gallery images (all except the first which is the cover)
    const newGalleryImages = imagesCopy.slice(1).map((img, i) => {
      // Remove the tracking property
      const { _originalIndex, ...cleanImg } = img;
      return {
        ...cleanImg,
        display_order: i
      };
    });
    
    onGalleryImagesChange(newGalleryImages);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleToggleMockup = useCallback((index: number) => {
    const hasPrimary = !!(primaryImage || newPrimaryFile);
    const adjustedIndex = hasPrimary ? index - 1 : index;
    
    if (adjustedIndex < 0 || adjustedIndex >= galleryImages.length) return;
    
    const updated = galleryImages.map((img, i) => 
      i === adjustedIndex ? { ...img, is_mockup: !img.is_mockup } : img
    );
    onGalleryImagesChange(updated);
  }, [primaryImage, newPrimaryFile, galleryImages, onGalleryImagesChange]);

  const getImageUrl = (img: GalleryImage) => {
    if (img.previewUrl) return img.previewUrl;
    if (img.image_url?.startsWith('data:')) return img.image_url;
    if (img.image_url?.startsWith('/api/')) return `${API_URL}${img.image_url}`;
    if (img.image_url?.startsWith('http')) return img.image_url;
    return `${API_URL}${img.image_url}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-rv-text">
          Artwork Images <span className="text-red-500">*</span>
          <span className="text-rv-textMuted font-normal text-xs ml-2">
            ({allImages.length}/{maxImages} images)
          </span>
        </label>
        {isEditing && primaryImage && (
          <span className="text-xs text-rv-textMuted">First image = cover image</span>
        )}
      </div>

      {allImages.length === 0 ? (
        <label className="w-full aspect-[2/1] md:aspect-[4/1] bg-rv-surface rounded-rvLg border-2 border-dashed border-rv-neutral hover:border-rv-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors p-8">
          <svg className="w-12 h-12 text-rv-textMuted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-lg font-semibold text-rv-text mb-1">Upload Artwork Images</span>
          <span className="text-sm text-rv-textMuted text-center">
            Select up to 4 images at once. First image will be your cover.
          </span>
          <span className="text-xs text-rv-textMuted mt-2">Click to browse or drag files here</span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleMultiFileUpload(e, true)}
            className="hidden"
            multiple
            required
          />
        </label>
      ) : (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: maxImages }).map((_, slotIndex) => {
          const img = allImages[slotIndex];
          const isEmptySlot = !img;
          const isFirstSlot = slotIndex === 0;
          
          if (isEmptySlot) {
            return (
              <label
                key={`empty-${slotIndex}`}
                className="aspect-square bg-rv-surface rounded-rvMd border-2 border-dashed border-rv-neutral hover:border-rv-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors"
              >
                <svg className="w-8 h-8 text-rv-textMuted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm text-rv-textMuted font-medium">
                  Artwork {slotIndex + 1}
                </span>
                <span className="text-xs text-rv-textMuted mt-1">Click to add</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleMultiFileUpload(e, false)}
                  className="hidden"
                  multiple
                />
              </label>
            );
          }
          
          return (
            <div
              key={img.id || `new-${slotIndex}`}
              draggable={allImages.length > 1}
              onDragStart={(e) => handleDragStart(e, slotIndex)}
              onDragOver={(e) => handleDragOver(e, slotIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, slotIndex)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square bg-rv-surface rounded-rvMd overflow-hidden border-2 transition-all ${
                draggedIndex === slotIndex
                  ? 'border-rv-primary opacity-50 scale-95'
                  : dropTargetIndex === slotIndex
                    ? 'border-rv-primary border-dashed bg-rv-primary/10'
                    : draggedIndex !== null
                      ? 'border-rv-primary/30'
                      : 'border-rv-neutral hover:border-rv-primary/50'
              } ${allImages.length > 1 ? 'cursor-grab active:cursor-grabbing' : ''}`}
            >
              <img
                src={getImageUrl(img)}
                alt={`Artwork ${slotIndex + 1}`}
                className="w-full h-full object-cover"
              />
              
              {draggedIndex !== null && (
                <span className="absolute top-1 left-1 w-5 h-5 bg-black/60 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {slotIndex + 1}
                </span>
              )}
              
              {slotIndex === 0 && draggedIndex === null && (
                <span className="absolute top-2 left-2 px-2 py-0.5 bg-rv-primary text-white text-xs font-semibold rounded-full">
                  Cover
                </span>
              )}
              
              {img.is_mockup && (
                <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#C9A24A] text-white text-xs font-semibold rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                  Mockup
                </span>
              )}
              
              <div className="absolute top-2 right-2 flex gap-1">
                {slotIndex > 0 && (
                  <button
                    type="button"
                    onClick={() => handleToggleMockup(slotIndex)}
                    title={img.is_mockup ? "Unmark as mockup" : "Mark as room mockup"}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                      img.is_mockup 
                        ? 'bg-[#C9A24A] text-white hover:bg-[#B8933F]' 
                        : 'bg-white/90 text-rv-textMuted hover:bg-white hover:text-[#C9A24A]'
                    }`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveImage(slotIndex)}
                  className="w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {slotIndex === 0 && !isEditing && (
                <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                  <span className="px-3 py-1.5 bg-white text-rv-text text-sm font-semibold rounded-rvMd">
                    Change
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleMultiFileUpload(e, true)}
                    className="hidden"
                    multiple
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
      )}

      {isEditing && artworkId && primaryImage && (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-rv-surface to-rv-warm/20 rounded-rvMd border border-rv-neutral">
          <div className="flex-shrink-0 w-10 h-10 bg-rv-primary/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-rv-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 22V12h6v10" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-rv-text">Create a Room Mockup</p>
            <p className="text-xs text-rv-textMuted">Visualize this artwork in realistic rooms to attract collectors</p>
          </div>
          <button
            type="button"
            onClick={() => setShowStudioWarning(true)}
            className="flex-shrink-0 px-4 py-2 bg-rv-primary text-white text-sm font-semibold rounded-rvMd hover:bg-rv-primary/90 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open in Studio
          </button>
        </div>
      )}

      {showStudioWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-bold text-rv-text mb-1">Before Opening Studio</h3>
                <p className="text-sm text-rv-textMuted">
                  The Studio uses your <strong>first artwork image</strong> as the original artwork.
                </p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-amber-800">
                Please make sure your first image is the <strong>original artwork photo</strong>, not a room mockup.
              </p>
              <p className="text-sm text-amber-700 mt-2">
                Otherwise, the artwork will appear as a <em>mockup inside another mockup</em>.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowStudioWarning(false)}
                className="flex-1 px-4 py-2.5 border border-rv-neutral text-rv-text text-sm font-semibold rounded-lg hover:bg-rv-surface transition-colors"
              >
                Cancel
              </button>
              <a
                href={`/#/studio?artworkId=${artworkId}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowStudioWarning(false)}
                className="flex-1 px-4 py-2.5 bg-rv-primary text-white text-sm font-semibold rounded-lg hover:bg-rv-primary/90 transition-colors text-center"
              >
                Continue to Studio
              </a>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-rv-textMuted">
        {!isEditing ? (
          <>Tip: After uploading, you can use RoomVibe Studio to create realistic room mockups that help collectors visualize your art.</>
        ) : (
          <>Tip: Use a <strong>clean artwork image</strong> as your cover. Avoid mockups as the first image.</>
        )}
      </p>
    </div>
  );
}

export default ArtworkImageGallery;
