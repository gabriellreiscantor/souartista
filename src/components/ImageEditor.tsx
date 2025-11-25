import { useState, useRef, useCallback, useEffect } from 'react';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut } from 'lucide-react';

interface ImageEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageFile: File | null;
  onSave: (croppedImage: Blob) => void;
}

export const ImageEditor = ({ open, onOpenChange, imageFile, onSave }: ImageEditorProps) => {
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5
  });
  const [zoom, setZoom] = useState(1);
  const [imageSrc, setImageSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const cropSize = Math.min(width, height);
    const cropPercentage = (cropSize / Math.max(width, height)) * 100;
    
    setCrop({
      unit: '%',
      width: cropPercentage,
      height: cropPercentage,
      x: (100 - cropPercentage) / 2,
      y: (100 - cropPercentage) / 2
    });
  }, []);

  const getCroppedImg = useCallback(async (): Promise<Blob> => {
    const image = imgRef.current;
    if (!image || !crop.width || !crop.height) {
      throw new Error('Crop canvas does not exist');
    }

    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const pixelCrop: PixelCrop = {
      unit: 'px',
      x: (crop.x / 100) * image.width * scaleX,
      y: (crop.y / 100) * image.height * scaleY,
      width: (crop.width / 100) * image.width * scaleX,
      height: (crop.height / 100) * image.height * scaleY
    };

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('No 2d context');
    }

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95
      );
    });
  }, [crop]);

  const handleSave = async () => {
    try {
      const croppedImage = await getCroppedImg();
      onSave(croppedImage);
      onOpenChange(false);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  // Load image when file changes
  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
      });
      reader.readAsDataURL(imageFile);
    }
  }, [imageFile]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Editar Foto</DialogTitle>
          <DialogDescription>
            Ajuste o zoom e a área de corte da sua foto de perfil.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Zoom Control */}
          <div className="flex items-center gap-4">
            <ZoomOut className="w-5 h-5 text-gray-600" />
            <Slider
              value={[zoom]}
              onValueChange={(value) => setZoom(value[0])}
              min={1}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600 min-w-[3rem]">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Image Crop Area */}
          <div className="relative flex justify-center items-center bg-gray-100 rounded-lg p-4 min-h-[400px]">
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{
                    transform: `scale(${zoom})`,
                    maxHeight: '500px',
                    maxWidth: '100%'
                  }}
                />
              </ReactCrop>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-primary text-white hover:bg-primary/90">
            Salvar Foto
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
