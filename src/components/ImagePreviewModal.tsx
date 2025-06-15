
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  startIndex?: number;
  alt?: string;
}

const ImagePreviewModal = ({ isOpen, onClose, images, startIndex = 0, alt }: ImagePreviewModalProps) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(startIndex);
    }
  }, [isOpen, startIndex]);

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || !images || images.length === 0) {
    return null;
  }

  const hasMultipleImages = images.length > 1;
  const currentImageUrl = images[currentIndex];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-0 flex items-center justify-center">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {hasMultipleImages && (
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentIndex === 0}
          >
            <ChevronLeft className="w-8 h-8" />
          </button>
        )}

        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={currentImageUrl}
            alt={alt || `Preview ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {hasMultipleImages && (
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={currentIndex === images.length - 1}
          >
            <ChevronRight className="w-8 h-8" />
          </button>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
