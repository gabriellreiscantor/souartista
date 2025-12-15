import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { toast } from 'sonner';

interface UseCameraOptions {
  onPhotoSelected: (file: File) => void;
}

export const useCamera = ({ onPhotoSelected }: UseCameraOptions) => {
  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform();

  const takePicture = async () => {
    try {
      // Use native camera on iOS/Android
      if (isNative) {
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Uri,
          source: CameraSource.Prompt, // Shows action sheet to choose camera or gallery
          correctOrientation: true,
          // iPad specific: popover presentation for action sheet
          promptLabelHeader: 'Selecionar foto',
          promptLabelCancel: 'Cancelar',
          promptLabelPhoto: 'Escolher da galeria',
          promptLabelPicture: 'Tirar foto',
        });

        if (image.webPath) {
          // Convert the image URI to a File object
          const response = await fetch(image.webPath);
          const blob = await response.blob();
          const file = new File([blob], 'profile-photo.jpg', { type: 'image/jpeg' });
          onPhotoSelected(file);
        }
      } else {
        // Fallback for web: trigger file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
              toast.error('A imagem deve ter no máximo 5MB');
              return;
            }
            // Validate file type
            if (!file.type.startsWith('image/')) {
              toast.error('Por favor, selecione uma imagem válida');
              return;
            }
            onPhotoSelected(file);
          }
        };
        input.click();
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      
      // Handle user cancellation gracefully
      if (error.message?.includes('User cancelled') || error.message?.includes('cancelled')) {
        return;
      }
      
      // Handle permission denied
      if (error.message?.includes('permission') || error.message?.includes('denied')) {
        toast.error('Permissão de câmera/fotos negada. Por favor, permita o acesso nas configurações do dispositivo.');
        return;
      }
      
      // Handle camera not available
      if (error.message?.includes('not available') || error.message?.includes('unavailable')) {
        toast.error('Câmera não disponível neste dispositivo');
        return;
      }
      
      toast.error('Erro ao acessar câmera ou galeria');
    }
  };

  return {
    takePicture,
    isNative,
    platform,
  };
};
