import React, { useState, useRef, useCallback } from 'react';

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
  onPrimaryImageChange: (file: File | null) => void;
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
  const [newPrimaryFile, setNewPrimaryFile] = useState<File | null>(null);
  const [primaryPreview, setPrimaryPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const canAddMore = allImages.length < maxImages;

  const handlePrimaryChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPrimaryFile(file);
      onPrimaryImageChange(file);
      const reader = new FileReader();
      reader.onload = () => setPrimaryPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, [onPrimaryImageChange]);

  const handleAddImage = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && canAddMore) {
      const reader = new FileReader();
      reader.onload = () => {
        const newImage: GalleryImage = {
          image_url: reader.result as string,
          display_order: galleryImages.length,
          is_mockup: false,
          isNew: true,
          file,
          previewUrl: reader.result as string
        };
        onGalleryImagesChange([...galleryImages, newImage]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  }, [galleryImages, canAddMore, onGalleryImagesChange]);

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

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const hasPrimary = !!(primaryImage || newPrimaryFile);
    
    if (hasPrimary) {
      if (draggedIndex === 0 || index === 0) return;
      
      const adjustedDraggedIndex = draggedIndex - 1;
      const adjustedTargetIndex = index - 1;
      
      const newImages = [...galleryImages];
      const [draggedItem] = newImages.splice(adjustedDraggedIndex, 1);
      newImages.splice(adjustedTargetIndex, 0, draggedItem);
      onGalleryImagesChange(newImages);
    } else {
      const newImages = [...galleryImages];
      const [draggedItem] = newImages.splice(draggedIndex, 1);
      newImages.splice(index, 0, draggedItem);
      onGalleryImagesChange(newImages);
    }
    
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {allImages.map((img, index) => (
          <div
            key={img.id || `new-${index}`}
            draggable={index > 0}
            onDragStart={() => handleDragStart(index)}
            onDragOver={(e) => handleDragOver(e, index)}
            onDragEnd={handleDragEnd}
            className={`relative aspect-square bg-rv-surface rounded-rvMd overflow-hidden border-2 transition-all ${
              draggedIndex === index
                ? 'border-rv-primary opacity-50'
                : 'border-rv-neutral hover:border-rv-primary/50'
            } ${index > 0 ? 'cursor-grab active:cursor-grabbing' : ''}`}
          >
            <img
              src={getImageUrl(img)}
              alt={`Artwork ${index + 1}`}
              className="w-full h-full object-cover"
            />
            
            {index === 0 && (
              <span className="absolute top-2 left-2 px-2 py-0.5 bg-rv-primary text-white text-xs font-semibold rounded-full">
                Cover
              </span>
            )}
            
            {img.is_mockup && (
              <span className="absolute bottom-2 left-2 px-2 py-0.5 bg-[#C9A24A] text-white text-xs font-semibold rounded-full flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                </svg>
                RoomVibe Mockup
              </span>
            )}
            
            <button
              type="button"
              onClick={() => handleRemoveImage(index)}
              className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {index === 0 && !isEditing && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <span className="px-3 py-1.5 bg-white text-rv-text text-sm font-semibold rounded-rvMd">
                  Change
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePrimaryChange}
                  className="hidden"
                />
              </label>
            )}
          </div>
        ))}

        {!isEditing && allImages.length === 0 && (
          <label className="aspect-square bg-rv-surface rounded-rvMd border-2 border-dashed border-rv-neutral hover:border-rv-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <svg className="w-8 h-8 text-rv-textMuted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm text-rv-textMuted font-medium">Add Cover Image</span>
            <span className="text-xs text-rv-textMuted mt-1">Required</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePrimaryChange}
              className="hidden"
              required
            />
          </label>
        )}

        {canAddMore && allImages.length > 0 && (
          <label className="aspect-square bg-rv-surface rounded-rvMd border-2 border-dashed border-rv-neutral hover:border-rv-primary/50 flex flex-col items-center justify-center cursor-pointer transition-colors">
            <svg className="w-8 h-8 text-rv-textMuted mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm text-rv-textMuted font-medium">Add Image</span>
            <span className="text-xs text-rv-textMuted mt-1">{maxImages - allImages.length} remaining</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleAddImage}
              className="hidden"
              ref={fileInputRef}
            />
          </label>
        )}
      </div>

      <p className="text-xs text-rv-textMuted">
        Tip: Use RoomVibe Studio to create realistic room mockups that help collectors visualize your art.
      </p>
    </div>
  );
}

export default ArtworkImageGallery;
