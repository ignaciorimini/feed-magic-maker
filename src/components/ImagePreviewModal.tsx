
import React from "react";
import { useState } from "react";
import { X, ArrowLeft, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  images?: string[]; // Array con todas las slides
  initialIndex?: number;
}

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, alt, images, initialIndex = 0 }: ImagePreviewModalProps) => {
  // Si hay imágenes para slider, usar index
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Si images existe y tiene elementos, usarla; sino, solo mostrar imageUrl
  const currentImage = images && images.length > 0 ? images[currentIndex] : imageUrl;

  const goPrev = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };
  const goNext = () => {
    if (!images || images.length === 0) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Si el modal se reabre con otro initialIndex, actualizar el index
  React.useEffect(() => {
    if (isOpen && images && images.length > 0) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, images, initialIndex]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-0">
        <div className="relative w-full h-full flex items-center justify-center min-h-[70vh]">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          {/* Flechas si hay imágenes */}
          {images && images.length > 1 && (
            <>
              <button
                onClick={goPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white"
              >
                <ArrowLeft className="w-7 h-7" />
              </button>
              <button
                onClick={goNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white"
              >
                <ArrowRight className="w-7 h-7" />
              </button>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm opacity-80">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}
          <img
            src={currentImage}
            alt={alt || 'Preview'}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewModal;
