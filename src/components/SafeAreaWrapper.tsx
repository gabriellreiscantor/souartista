import { useNativePlatform } from '@/hooks/useNativePlatform';

interface SafeAreaWrapperProps {
  children: React.ReactNode;
  className?: string;
}

export const SafeAreaWrapper = ({ children, className = '' }: SafeAreaWrapperProps) => {
  const { isNative, platform } = useNativePlatform();

  // Only apply safe area padding on native iOS
  const safeAreaClass = isNative && platform === 'ios' ? 'safe-area-top' : '';

  return (
    <div className={`${safeAreaClass} ${className}`}>
      {children}
    </div>
  );
};

export default SafeAreaWrapper;
