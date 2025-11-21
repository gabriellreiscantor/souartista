import { useState, useEffect } from 'react';

interface ReportVisibilitySettings {
  showGrossRevenue: boolean;
  showShowCosts: boolean;
  showNetProfit: boolean;
  showLocomotion: boolean;
}

const STORAGE_KEY = 'report-visibility-settings';

const defaultSettings: ReportVisibilitySettings = {
  showGrossRevenue: true,
  showShowCosts: true,
  showNetProfit: true,
  showLocomotion: true,
};

export const useReportVisibility = () => {
  const [settings, setSettings] = useState<ReportVisibilitySettings>(defaultSettings);

  useEffect(() => {
    // Load settings from localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSettings(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading report visibility settings:', error);
      }
    }
  }, []);

  const updateSettings = (newSettings: Partial<ReportVisibilitySettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  return { settings, updateSettings };
};
