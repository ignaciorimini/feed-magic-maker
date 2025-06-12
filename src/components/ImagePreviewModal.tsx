
import { X } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
}

const ImagePreviewModal = ({ isOpen, onClose, imageUrl, alt }: ImagePreviewModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-black/90 border-0">
        <div className="relative w-full h-full flex items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-50 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <img
            src={imageUrl}
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
