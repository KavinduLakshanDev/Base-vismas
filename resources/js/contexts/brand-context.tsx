import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { getImagePath } from '@/utils/helpers';

export interface BrandSettings {
  logo_dark?: string;
  logo_light?: string;
  favicon?: string;
  titleText?: string;
  footerText?: string;
  sidebarVariant?: string;
  sidebarStyle?: string;
  layoutDirection?: string;
  themeMode?: string;
  themeColor?: string;
  customColor?: string;
  [key: string]: any;
}

interface BrandContextType {
  settings: BrandSettings;
  setPreviewSettings: (newSettings: Partial<BrandSettings> | null) => void;
  getPreviewUrl: (path: string) => string;
  getPrimaryColor: () => string;
  sidebarVariant: 'inset' | 'floating' | 'sidebar';
  sidebarStyle: 'plain' | 'colored' | 'gradient';
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const parentContext = useContext(BrandContext);
  if (parentContext) {
    return <>{children}</>;
  }

  const { adminAllSetting, companyAllSetting, globalSettings: pageGlobalSettings } = usePage().props as any;

  // Merge settings from all available sources
  const mergedSettings = {
    ...(adminAllSetting || {}),
    ...(companyAllSetting || {}),
    ...(pageGlobalSettings || {}),
  };

  const defaultSettings: BrandSettings = {
    logo_dark: mergedSettings?.logo_dark || '',
    logo_light: mergedSettings?.logo_light || '',
    favicon: mergedSettings?.favicon || '',
    titleText: mergedSettings?.titleText || 'Vismass',
    footerText: mergedSettings?.footerText || `© ${new Date().getFullYear()} Vismass. All rights reserved.`,
    sidebarVariant: mergedSettings?.sidebarVariant || 'inset',
    sidebarStyle: mergedSettings?.sidebarStyle || 'plain',
    layoutDirection: mergedSettings?.layoutDirection || 'ltr',
    themeMode: mergedSettings?.themeMode || 'light',
    themeColor: mergedSettings?.themeColor || 'blue',
    customColor: mergedSettings?.customColor || '#3b82f6',
  };

  const [previewSettings, setPreviewSettingsState] = useState<Partial<BrandSettings> | null>(null);

  const settings: BrandSettings = {
    ...defaultSettings,
    ...(previewSettings || {}),
  };

  const setPreviewSettings = (newSettings: Partial<BrandSettings> | null) => {
    setPreviewSettingsState(newSettings);
  };

  const themeColors: Record<string, string> = {
    blue: '#3b82f6',
    green: '#007c30',
    purple: '#8b5cf6',
    orange: '#f97316',
    red: '#ef4444',
  };

  const getPrimaryColor = () => {
    if (settings.themeColor === 'custom') {
      return settings.customColor || '#3b82f6';
    }
    return themeColors[settings.themeColor as string] || '#3b82f6';
  };

  const getPreviewUrl = (path: string) => {
    return getImagePath(path);
  };

  useEffect(() => {
    const primaryColor = getPrimaryColor();
    const root = document.documentElement;

    // Apply primary colors to CSS variables
    root.style.setProperty('--primary', primaryColor);
    root.style.setProperty('--sidebar-primary', primaryColor);
    root.style.setProperty('--sidebar-ring', primaryColor);
    root.style.setProperty('--ring', primaryColor);
    root.style.setProperty('--vismass-blue', primaryColor);

    // Layout Direction
    const isRTL = settings.layoutDirection === 'rtl';
    root.dir = isRTL ? 'rtl' : 'ltr';
    root.style.direction = isRTL ? 'rtl' : 'ltr';
    document.body.dir = isRTL ? 'rtl' : 'ltr';
    document.body.style.direction = isRTL ? 'rtl' : 'ltr';
    if (isRTL) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    } else {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }

    // Theme Mode (Light / Dark / Auto)
    const themeMode = settings.themeMode || 'light';
    const isDark =
      themeMode === 'dark' ||
      ((themeMode === 'auto' || themeMode === 'system') && typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);

    root.classList.toggle('dark', isDark);
    root.style.colorScheme = isDark ? 'dark' : 'light';
    if (isDark) {
      document.body.classList.remove('light');
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
      document.body.classList.add('light');
    }

    // Sync appearance in localStorage & cookie
    try {
      const modeVal = themeMode === 'auto' ? 'system' : themeMode;
      localStorage.setItem('appearance', modeVal);
      document.cookie = `appearance=${modeVal};path=/;max-age=31536000;SameSite=Lax`;
    } catch {
      // ignore in SSR
    }

    // Dynamic Sidebar styling for colored and gradient modes
    let existingStyle = document.getElementById('brand-sidebar-styles') as HTMLStyleElement | null;
    if (!existingStyle) {
      existingStyle = document.createElement('style');
      existingStyle.id = 'brand-sidebar-styles';
      document.head.appendChild(existingStyle);
    }

    if (settings.sidebarStyle === 'colored' || settings.sidebarStyle === 'gradient') {
      const sidebarBg = settings.sidebarStyle === 'colored'
        ? primaryColor
        : `linear-gradient(180deg, ${primaryColor} 0%, color-mix(in srgb, ${primaryColor} 65%, black) 100%)`;

      existingStyle.textContent = `
        [data-sidebar="sidebar"] {
          background: ${sidebarBg} !important;
          color: #ffffff !important;
        }
        [data-sidebar="sidebar"] * {
          --sidebar-foreground: 0 0% 100%;
          --sidebar-border: rgba(255, 255, 255, 0.15);
        }
        [data-sidebar="sidebar"] [data-sidebar="group-label"],
        [data-sidebar="sidebar"] .text-black,
        [data-sidebar="sidebar"] .text-sidebar-foreground {
          color: rgba(255, 255, 255, 0.8) !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="menu-button"] {
          color: #ffffff !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="menu-button"] svg {
          color: #ffffff !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="menu-button"]:hover {
          background: rgba(255, 255, 255, 0.15) !important;
          color: #ffffff !important;
        }
        [data-sidebar="sidebar"] [data-sidebar="menu-button"][data-active="true"] {
          background: rgba(255, 255, 255, 0.25) !important;
          color: #ffffff !important;
          font-weight: 600;
        }
        [data-sidebar="sidebar"] [data-slot="sidebar-header"],
        [data-sidebar="sidebar"] [data-slot="sidebar-footer"] {
          border-color: rgba(255, 255, 255, 0.15) !important;
        }
      `;
    } else {
      existingStyle.textContent = '';
    }
  }, [settings.themeColor, settings.customColor, settings.layoutDirection, settings.themeMode, settings.sidebarStyle]);

  const sidebarVariant = (
    settings.sidebarVariant === 'floating'
      ? 'floating'
      : settings.sidebarVariant === 'minimal'
      ? 'sidebar'
      : 'inset'
  ) as 'inset' | 'floating' | 'sidebar';

  const sidebarStyle = (settings.sidebarStyle || 'plain') as 'plain' | 'colored' | 'gradient';

  return (
    <BrandContext.Provider value={{
      settings,
      setPreviewSettings,
      getPreviewUrl,
      getPrimaryColor,
      sidebarVariant,
      sidebarStyle,
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}