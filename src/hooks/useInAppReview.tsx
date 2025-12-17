import { useCallback } from 'react';
import { useNativePlatform } from './useNativePlatform';

const REVIEW_KEY = 'lastReviewRequest';
const MIN_DAYS_BETWEEN_REVIEWS = 30;
const MIN_SHOWS_BEFORE_REVIEW = 3;

export const useInAppReview = () => {
  const { isNative, isIOS } = useNativePlatform();

  const canRequestReview = useCallback((): boolean => {
    // Only available on native platforms
    if (!isNative) return false;

    const lastRequest = localStorage.getItem(REVIEW_KEY);
    if (!lastRequest) return true;

    const lastDate = new Date(lastRequest);
    const now = new Date();
    const daysSinceLastRequest = Math.floor(
      (now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    return daysSinceLastRequest >= MIN_DAYS_BETWEEN_REVIEWS;
  }, [isNative]);

  const requestReview = useCallback(async (showCount?: number): Promise<void> => {
    // Check if we should request review
    if (!canRequestReview()) {
      console.log('[InAppReview] Review request skipped - too recent or not native');
      return;
    }

    // Optionally check show count threshold
    if (showCount !== undefined && showCount < MIN_SHOWS_BEFORE_REVIEW) {
      console.log('[InAppReview] Review request skipped - not enough shows:', showCount);
      return;
    }

    try {
      // Dynamically import to avoid issues on web
      const { InAppReview } = await import('@capacitor-community/in-app-review');
      
      console.log('[InAppReview] Requesting review...');
      await InAppReview.requestReview();
      
      // Save the request timestamp
      localStorage.setItem(REVIEW_KEY, new Date().toISOString());
      console.log('[InAppReview] Review requested successfully');
    } catch (error) {
      console.error('[InAppReview] Error requesting review:', error);
    }
  }, [canRequestReview]);

  return {
    requestReview,
    canRequestReview,
    isAvailable: isNative
  };
};
